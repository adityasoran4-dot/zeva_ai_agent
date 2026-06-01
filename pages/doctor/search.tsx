"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import {
  MapPin,
  Search,
  Star,
  Navigation,
  Shield,
  X,
  BadgeIndianRupee,
  Clock,
  HeartPulse,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import AuthModal from "../../components/AuthModal";
import dayjs from "dayjs";
import Image from "next/image";
import { Stethoscope } from "lucide-react";
import { normalizeImagePath } from "../../lib/utils";

interface Doctor {
  _id: string;
  user: { name: string; phone?: string; email?: string; _id?: string };
  degree: string;
  address: string;
  photos: string[];
  verified: boolean;
  distance?: number;
  consultationFee?: number;
  timeSlots: Array<{
    date: string;
    availableSlots: number;
    sessions: {
      morning: string[];
      evening: string[];
    };
  }>;
  treatments?: Array<{
    mainTreatment: string;
    mainTreatmentSlug: string;
    subTreatments: Array<{
      name: string;
      slug: string;
    }>;
  }>;
  treatment?: string | string[]; // Keep for backward compatibility
  experience: number;
  clinicContact: string;
  location: {
    coordinates: [number, number];
  };
}

interface Suggestion {
  type: string;
  value: string;
}

interface ReviewData {
  averageRating: number;
  totalReviews: number;
  reviews: Array<{
    comment: string;
    userId: { name: string };
  }>;
}

export default function FindDoctor() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  ); // Searched location coordinates
  const [userCurrentLocation, setUserCurrentLocation] = useState<{ lat: number; lng: number } | null>(null); // User's actual current location
  const [manualPlace, setManualPlace] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [starFilter, setStarFilter] = useState(0);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedDoctor] = useState<Doctor | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode] = useState<"login" | "register">(
    "login"
  );
  const [pendingAction, setPendingAction] = useState<{
    type: string;
    doctor: Doctor;
  } | null>(null);
  const [doctorReviews, setDoctorReviews] = useState<{
    [key: string]: ReviewData;
  }>({});
  const [_reviewsLoading, setReviewsLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [specialtiesLoading, setSpecialtiesLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Add ref for results section
  const resultsRef = useRef<HTMLDivElement>(null);

  // Add missing state variables
  const [priceRange, setPriceRange] = useState([0, 50000]);
  // const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('relevance');

  // Add the clearAllFilters function
  const clearFilters = () => {
    setPriceRange([0, 50000]);
    setSelectedTimes([]);
    setStarFilter(0);
    setSortBy('relevance');
  };

  const getSortedDoctors = (doctors: Doctor[]) => {
    const sorted = [...doctors];

    switch (sortBy) {
      case 'price-low-high':
        return sorted.sort((a, b) => (a.consultationFee || 0) - (b.consultationFee || 0));
      case 'price-high-low':
        return sorted.sort((a, b) => (b.consultationFee || 0) - (a.consultationFee || 0));
      case 'rating-high-low':
        return sorted.sort((a, b) => {
          const ratingA = doctorReviews[a._id]?.averageRating || 0;
          const ratingB = doctorReviews[b._id]?.averageRating || 0;
          return ratingB - ratingA;
        });
      case 'experience-high-low':
        return sorted.sort((a, b) => (b.experience || 0) - (a.experience || 0));
      default:
        return sorted;
    }
  };

  const router = useRouter();
  // const { isAuthenticated, user } = useAuth();

  // Helper function to convert text to slug
  const textToSlug = (text: string) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
  };

  // Helper function to convert slug back to readable text
  const slugToText = (slug: string) => {
    if (!slug) return '';
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Update URL with search parameters - ALWAYS use values from input fields
  const updateURL = (treatment: string, location: string) => {
    // Set flag to prevent useEffect from interfering
    isUpdatingURL.current = true;
   
    const params = new URLSearchParams();
    if (treatment) {
      params.set('treatment', textToSlug(treatment));
    }
    if (location) {
      // Always use the actual location value from input - no special handling
      params.set('location', textToSlug(location));
    }
    const newUrl = params.toString()
      ? `${router.pathname}?${params.toString()}`
      : router.pathname;
   
    router.replace(newUrl, undefined, { shallow: true });
   
    // Reset flag after a short delay to allow URL to update
    setTimeout(() => {
      isUpdatingURL.current = false;
    }, 100);
  };

  // Flag to prevent useEffect from interfering during URL updates
  const isUpdatingURL = useRef(false);
  const hasSearchedFromURL = useRef(false);


  // Add scroll to results functionality
  useEffect(() => {
    if (doctors.length > 0 && !loading && resultsRef.current) {
      // Add a small delay to ensure the results are rendered
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [doctors, loading]);

  // Reset pagination when filters or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedService, query, starFilter, priceRange, sortBy, selectedTimes]);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const suggestionsDropdownRef = useRef<HTMLDivElement | null>(null);

  // Fetch specialties on component mount
  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        setSpecialtiesLoading(true);
        const res = await axios.get("/api/doctor/specialties");
        if (res.data.success && res.data.specialties) {
          setSpecialties(res.data.specialties);
        }
      } catch (error) {
        console.error("Error fetching specialties:", error);
        // Fallback to empty array or default specialties if API fails
        setSpecialties([]);
      } finally {
        setSpecialtiesLoading(false);
      }
    };
    fetchSpecialties();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Use a per-page session token for doctor search
      const sessionToken = sessionStorage.getItem(
        "ayurvedaDoctorSearchSession"
      );
      if (!sessionToken) {
        // This is a new session for doctor search (all tabs were closed)
        localStorage.removeItem("ayurvedaDoctorSearchState");
        // Generate and store a new session token
        const newSessionToken =
          Math.random().toString(36).substr(2, 9) + Date.now();
        sessionStorage.setItem("ayurvedaDoctorSearchSession", newSessionToken);
      }
      // Only THEN load persisted state
      try {
        const persistedState = localStorage.getItem(
          "ayurvedaDoctorSearchState"
        );
        if (persistedState) {
          const state = JSON.parse(persistedState);
          // Check if state is not older than 24 hours
          const now = Date.now();
          const stateAge = now - (state.timestamp || 0);
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

          if (stateAge < maxAge && state.doctors && state.doctors.length > 0) {
            setDoctors(state.doctors);
            setCoords(state.coords);
            setSelectedService(state.selectedService || "");
            setManualPlace(state.manualPlace || "");
            setQuery(state.query || "");
            setStarFilter(state.starFilter || 0);
            setViewMode(state.viewMode || "list");

            // Fetch reviews for all persisted doctors
            state.doctors.forEach((doctor: Doctor) => {
              if (doctor._id) {
                fetchDoctorReviews(doctor._id);
              }
            });
          } else {
            // Clear expired state
            clearPersistedState();
          }
        }
      } catch {
        // console.error("Error loading persisted state:", error);
      }
    }
  }, []);

  // Recalculate distances when user location becomes available and doctors are already loaded
  useEffect(() => {
    if (userCurrentLocation && userCurrentLocation.lat && userCurrentLocation.lng && doctors.length > 0) {
      recalculateDistancesForDoctors(userCurrentLocation.lat, userCurrentLocation.lng);
    }
  }, [userCurrentLocation]); // Recalculate when user location changes

  // Get user's current location on component mount (for distance calculation)
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation && !userCurrentLocation) {
      // Silently try to get user's current location in the background
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserCurrentLocation({ lat: latitude, lng: longitude });
        },
        () => {
          // Silently fail - user's location not available or permission denied
          // This is okay, we'll use searched location for distance calculation
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000 // Cache for 5 minutes
        }
      );
    }
  }, []); // Only run once on mount

  // Separate useEffect for URL query parameters to avoid conflicts with localStorage
  useEffect(() => {
    if (!router.isReady || hasSearchedFromURL.current || isUpdatingURL.current) return;
   
    const { treatment, location } = router.query;
    if (treatment || location) {
      const treatmentText = treatment ? slugToText(String(treatment)) : '';
      const locationText = location ? slugToText(String(location)) : '';
     
      // Check if current form values don't match URL params (to avoid overwriting manual input)
      const currentLocationMatches = !locationText || manualPlace.trim().toLowerCase() === locationText.toLowerCase();
     
      if (locationText && locationText !== 'near-me' && !currentLocationMatches) {
        hasSearchedFromURL.current = true;
       
        // Set the form values
        if (treatmentText) {
          setQuery(treatmentText);
          setSelectedService(treatmentText);
        }
        setManualPlace(locationText);

        // Auto-search with a small delay to ensure state is set
        setTimeout(() => {
          searchByPlaceFromURL(locationText, treatmentText || null);
        }, 300);
      } else if (locationText === 'near-me' && treatmentText) {
        hasSearchedFromURL.current = true;
       
        // Handle near-me case
        setQuery(treatmentText);
        setSelectedService(treatmentText);
        // Trigger locateMe after a delay
        setTimeout(() => {
          locateMe();
        }, 300);
      } else if (treatmentText && !locationText) {
        hasSearchedFromURL.current = true;
        setQuery(treatmentText);
        setSelectedService(treatmentText);
        setLoading(true);
        setDoctors([]);
        axios
          .get("/api/doctor/searchByTreatment", { params: { treatment: treatmentText } })
          .then((res) => {
            const docs = Array.isArray(res.data?.doctors) ? res.data.doctors : [];
            setDoctors(docs);
            docs.forEach((d: any) => {
              if (d._id) fetchDoctorReviews(d._id);
            });
          })
          .finally(() => setLoading(false));
      }
    }
  }, [router.isReady, router.query.treatment, router.query.location]);

  // Save search state to localStorage whenever it changes
  useEffect(() => {
    if (doctors.length > 0 && coords) {
      const stateToPersist = {
        doctors,
        coords,
        selectedService,
        manualPlace,
        query,
        starFilter,
        viewMode,
        timestamp: Date.now(),
      };
      localStorage.setItem(
        "ayurvedaDoctorSearchState",
        JSON.stringify(stateToPersist)
      );
    }
  }, [
    doctors,
    coords,
    selectedService,
    manualPlace,
    query,
    starFilter,
    viewMode,
  ]);

  // Clear persisted state when user performs a new search
  const clearPersistedState = () => {
    localStorage.removeItem("ayurvedaDoctorSearchState");
  };

  // Add clear search function
  const clearSearch = () => {
    setDoctors([]);
    setCoords(null);
    setUserCurrentLocation(null); // Also clear user's current location
    setSelectedService("");
    setManualPlace("");
    setQuery("");
    setStarFilter(0);
    setSuggestions([]);
    clearPersistedState();
    // Clear session token so that on refresh, previous results won't be loaded
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("ayurvedaDoctorSearchSession");
    }
    // Clear URL parameters
    updateURL("", "");
    toast("Search cleared", { icon: "🧹" });
  };

  // Function to fetch reviews for a single doctor
  const fetchDoctorReviews = async (doctorId: string) => {
    setReviewsLoading((prev) => ({ ...prev, [doctorId]: true }));
    try {
      const res = await axios.get(`/api/doctor/reviews/${doctorId}`);
      if (res.data.success) {
        setDoctorReviews((prev) => ({
          ...prev,
          [doctorId]: res.data.data,
        }));
      }
    } catch {
      setDoctorReviews((prev) => ({
        ...prev,
        [doctorId]: {
          averageRating: 0,
          totalReviews: 0,
          reviews: [],
        },
      }));
    } finally {
      setReviewsLoading((prev) => ({ ...prev, [doctorId]: false }));
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (pendingAction) {
      if (pendingAction.type === "enquiry") {
        const params = new URLSearchParams({
          doctorId: pendingAction.doctor._id,
          doctorName: pendingAction.doctor.user.name,
          specialization: pendingAction.doctor.degree,
        });
        router.push(`/doctor/enquiry-form?${params.toString()}`);
      } else if (pendingAction.type === "review") {
        const params = new URLSearchParams({
          doctorId: pendingAction.doctor._id,
          doctorName: pendingAction.doctor.user.name,
        });
        router.push(`/doctor/review-form?${params.toString()}`);
      }
      setPendingAction(null);
    }
  };

  const handleAuthModalClose = () => {
    setShowAuthModal(false);
    setPendingAction(null);
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance}km`;
  };

  // Helper function to recalculate distances for existing doctors when user location is available
  const recalculateDistancesForDoctors = (userLat: number, userLng: number) => {
    if (!userLat || !userLng) return;
    
    setDoctors(prevDoctors => {
      return prevDoctors.map(doctor => {
        if (
          doctor.location &&
          doctor.location.coordinates &&
          doctor.location.coordinates.length === 2
        ) {
          const doctorLng = doctor.location.coordinates[0];
          const doctorLat = doctor.location.coordinates[1];
          const distance = calculateDistance(userLat, userLng, doctorLat, doctorLng);
          return {
            ...doctor,
            distance: distance,
          };
        }
        return doctor;
      });
    });
  };

  const fetchSuggestions = async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(`/api/doctor/search?q=${q}`);
      // API returns array of objects with { type: 'treatment' | 'subcategory', value: string }
      if (response.data.treatments && Array.isArray(response.data.treatments)) {
        // Handle both old format (strings) and new format (objects)
        const treatmentSuggestions = response.data.treatments.map((t: any) => {
          // If it's already an object with type and value, use it as-is
          if (typeof t === 'object' && t !== null && 'type' in t && 'value' in t) {
            return { type: t.type, value: t.value };
          }
          // If it's a string (old format), wrap it
          if (typeof t === 'string') {
            return { type: 'treatment', value: t };
          }
          // Fallback
          return { type: 'treatment', value: String(t) };
        });
        setSuggestions(treatmentSuggestions);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    }
  };

  // Update fetchDoctors to accept a service parameter
  type FetchDoctorsType = (
    lat: number,
    lng: number,
    service?: string
  ) => Promise<void>;

  const fetchDoctors: FetchDoctorsType = async (lat, lng, service) => {
    setLoading(true);
    try {
      const res = await axios.get("/api/doctor/nearby", {
        params: { lat, lng, service: service ?? selectedService },
      });

      // Use user's current location for distance calculation if available, otherwise use searched location
      const distanceLat = userCurrentLocation?.lat || lat;
      const distanceLng = userCurrentLocation?.lng || lng;

      const doctorsWithDistance = res.data.doctors.map((doctor: Doctor) => {
        if (doctor.location?.coordinates?.length === 2) {
          const doctorLng = doctor.location.coordinates[0];
          const doctorLat = doctor.location.coordinates[1];
          // Calculate distance from user's current location (or searched location if current location not available)
          const distance = calculateDistance(distanceLat, distanceLng, doctorLat, doctorLng);
          return { ...doctor, distance };
        }
        return { ...doctor, distance: null };
      });

      doctorsWithDistance.sort((a: Doctor, b: Doctor) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return (a.distance || 0) - (b.distance || 0);
      });

      setDoctors(doctorsWithDistance);

      // Fetch reviews for all doctors
      doctorsWithDistance.forEach((doctor: Doctor) => {
        if (doctor._id) {
          fetchDoctorReviews(doctor._id);
        }
      });
    } catch {
      // console.error("Error fetching doctors:", err);
    } finally {
      setLoading(false);
    }
  };

  // Update locateMe to pass selectedService
  const locateMe = () => {
    // Reset URL search flag so manual searches work
    hasSearchedFromURL.current = false;
   
    setLoading(true);
    setDoctors([]); // Clear previous results to show loading state in results area
    
    // Explicitly scroll to results section
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    clearPersistedState(); // Clear old state when starting new search
    
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported in this browser");
      setLoading(false);
      return;
    }

    // Get values from input fields
    const treatmentValue = query.trim();
    const locationValue = manualPlace.trim();
    const serviceToUse = selectedService || treatmentValue;
    
    // Update URL with values from input fields (if location is empty, use "near-me")
    const locationForURL = locationValue || 'near-me';
    updateURL(serviceToUse || treatmentValue, locationForURL);

    // Request location permission from browser (will show browser's native permission dialog)
    const locatingToast = toast.loading("Getting your location...");
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setUserCurrentLocation({ lat: latitude, lng: longitude }); // Store user's current location
        
        // If doctors are already loaded, recalculate distances with user's current location
        if (doctors.length > 0) {
          recalculateDistancesForDoctors(latitude, longitude);
        }
        
        fetchDoctors(latitude, longitude, selectedService);
        toast.success("Location access granted! Showing distances from your location.");
        toast.dismiss(locatingToast);
      },
      (error) => {
        toast.dismiss(locatingToast);
        let errorMessage = "Location access denied";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Location permission denied. Please enable location access in your browser settings to see distances.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Unable to detect your location. Please try again.";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Location request timed out. Please try again.";
        }
        toast.error(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0 // Don't use cached location
      }
    );
  };

  // Update searchByPlace to pass selectedService
  const searchByPlace = async () => {
    // ALWAYS get location value directly from input field
    const placeQuery = manualPlace.trim();
    if (!placeQuery) return;

    setLoading(true);
    setDoctors([]); // Clear previous results to show loading state in results area
    
    // Explicitly scroll to results section
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    clearPersistedState(); // Clear old state when starting new search
   
    // Try to get user's current location in the background (for distance calculation)
    if (typeof window !== "undefined" && navigator.geolocation && !userCurrentLocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserCurrentLocation({ lat: latitude, lng: longitude });
        },
        () => {
          // Silently fail - will use searched location for distance
        },
        {
          enableHighAccuracy: false,
          timeout: 3000,
          maximumAge: 300000
        }
      );
    }
   
    try {
      const res = await axios.get("/api/doctor/geocode", {
        params: { place: placeQuery },
      });
      setCoords({ lat: res.data.lat, lng: res.data.lng });
     
      // Get values from input fields for URL update
      const treatmentValue = query.trim();
      const serviceToUse = selectedService || treatmentValue;
     
      // Update URL with values from input fields - always use actual input values
      updateURL(serviceToUse || treatmentValue, placeQuery);
     
      fetchDoctors(res.data.lat, res.data.lng, selectedService);
    } catch {
      // console.error("Error in manual place search:", err);
      setLoading(false);
    }
  };

  // Separate function for URL-based searches (to avoid infinite loops)
  const searchByPlaceFromURL = async (locationText: string, serviceText: string | null = null) => {
    if (!locationText) return;

    setLoading(true);
    clearPersistedState();
    try {
      const res = await axios.get("/api/doctor/geocode", {
        params: { place: locationText },
      });

      setCoords({ lat: res.data.lat, lng: res.data.lng });
      setManualPlace(locationText);
     
      if (serviceText) {
        setQuery(serviceText);
        setSelectedService(serviceText);
      }
     
      fetchDoctors(res.data.lat, res.data.lng, serviceText || undefined);
    } catch {
      // console.error("Error in URL-based place search:", err);
      setLoading(false);
    }
  };

  // Update handleSearch to pass query as service
  const handleSearch = async () => {
    // Reset URL search flag so manual searches work
    hasSearchedFromURL.current = false;
   
    // ALWAYS get values directly from input fields
    const treatmentValue = query.trim();
    const locationValue = manualPlace.trim();
   
    if (treatmentValue && coords) {
      clearPersistedState(); // Clear old state when starting new search
      setSelectedService(treatmentValue);
      setDoctors([]); // Clear previous results
      
      // Explicitly scroll to results section
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
     
      // Update URL with values from input fields
      updateURL(treatmentValue, locationValue || 'near-me');
     
      fetchDoctors(coords.lat, coords.lng, treatmentValue);
    } else if (locationValue) {
      // Update URL before searching
      updateURL(treatmentValue, locationValue);
      searchByPlace();
    }
  };

  const filteredDoctors = getSortedDoctors(
    doctors.filter(doctor => {
      // Existing filters...
      // Check if service matches in degree OR in treatments array
      const matchesService = !selectedService || (() => {
        const serviceLower = selectedService.toLowerCase();
        // Split service by hyphens and spaces to check for partial matches
        const serviceParts = serviceLower.split(/[- ]+/).filter(p => p.length > 0);
       
        // Check degree field
        if (doctor.degree && doctor.degree.toLowerCase().includes(serviceLower)) {
          return true;
        }
       
        // Check treatments array
        if (doctor.treatments && Array.isArray(doctor.treatments)) {
          return doctor.treatments.some((treatment: any) => {
            const mainTreatmentLower = treatment.mainTreatment?.toLowerCase() || '';
            const mainTreatmentSlugLower = treatment.mainTreatmentSlug?.toLowerCase() || '';
           
            // Check if service contains treatment or treatment contains service
            if (mainTreatmentLower && (
              mainTreatmentLower.includes(serviceLower) ||
              serviceLower.includes(mainTreatmentLower)
            )) {
              return true;
            }
           
            // Check if service contains treatment slug or treatment slug contains service
            if (mainTreatmentSlugLower && (
              mainTreatmentSlugLower.includes(serviceLower) ||
              serviceLower.includes(mainTreatmentSlugLower) ||
              mainTreatmentSlugLower === serviceLower
            )) {
              return true;
            }
           
            // Check if any part of the service matches the treatment (for "vaccination-pediatrics" matching "pediatrics")
            if (serviceParts.length > 0 && mainTreatmentSlugLower) {
              if (serviceParts.some(part => mainTreatmentSlugLower.includes(part) || part.includes(mainTreatmentSlugLower))) {
                return true;
              }
            }
           
            // Check subTreatments
            if (treatment.subTreatments && Array.isArray(treatment.subTreatments)) {
              return treatment.subTreatments.some((sub: any) => {
                const subNameLower = sub.name?.toLowerCase() || '';
                const subSlugLower = sub.slug?.toLowerCase() || '';
               
                if (subNameLower && (
                  subNameLower.includes(serviceLower) ||
                  serviceLower.includes(subNameLower)
                )) {
                  return true;
                }
               
                if (subSlugLower && (
                  subSlugLower.includes(serviceLower) ||
                  serviceLower.includes(subSlugLower) ||
                  subSlugLower === serviceLower
                )) {
                  return true;
                }
               
                // Check if any part of the service matches the sub treatment
                if (serviceParts.length > 0 && subSlugLower) {
                  if (serviceParts.some(part => subSlugLower.includes(part) || part.includes(subSlugLower))) {
                    return true;
                  }
                }
               
                return false;
              });
            }
            return false;
          });
        }
       
        // Check legacy treatment field (backward compatibility)
        if (doctor.treatment) {
          const treatmentArray = Array.isArray(doctor.treatment)
            ? doctor.treatment
            : [doctor.treatment];
          return treatmentArray.some((t: string) => {
            const tLower = t.toLowerCase();
            return tLower.includes(serviceLower) || serviceLower.includes(tLower);
          });
        }
       
        return false;
      })();

      const matchesStars = starFilter === 0 ||
        (doctorReviews[doctor._id]?.averageRating >= starFilter);

      // New filters
      const matchesPrice = !doctor.consultationFee ||
        (doctor.consultationFee >= priceRange[0] && doctor.consultationFee <= priceRange[1]);

      // Add timing filter logic based on your timeSlots structure
      const matchesTiming = selectedTimes.length === 0 || selectedTimes.some(selectedTime => {
        // Handle special availability options
        if (selectedTime === 'Available Today') {
          const today = dayjs().startOf('day');
          return doctor.timeSlots?.some(slot => {
            const slotDate = dayjs(capitalizeMonth(slot.date) + ' ' + dayjs().year(), 'DD MMMM YYYY');
            return slotDate.isSame(today, 'day') && slot.availableSlots > 0;
          });
        }

        if (selectedTime === 'Available Tomorrow') {
          const tomorrow = dayjs().add(1, 'day').startOf('day');
          return doctor.timeSlots?.some(slot => {
            const slotDate = dayjs(capitalizeMonth(slot.date) + ' ' + dayjs().year(), 'DD MMMM YYYY');
            return slotDate.isSame(tomorrow, 'day') && slot.availableSlots > 0;
          });
        }

        if (selectedTime === 'Weekend Available') {
          return doctor.timeSlots?.some(slot => {
            const slotDate = dayjs(capitalizeMonth(slot.date) + ' ' + dayjs().year(), 'DD MMMM YYYY');
            const dayOfWeek = slotDate.day(); // 0 = Sunday, 6 = Saturday
            return (dayOfWeek === 0 || dayOfWeek === 6) && slot.availableSlots > 0;
          });
        }

        // Handle specific time slots
        return doctor.timeSlots?.some(slot => {
          const morningSlots = slot.sessions.morning || [];
          const eveningSlots = slot.sessions.evening || [];
          return (morningSlots.includes(selectedTime) || eveningSlots.includes(selectedTime)) && slot.availableSlots > 0;
        });
      });

      return matchesService && matchesStars && matchesPrice && matchesTiming;
    })
  );
  // Fix modal scroll lock and ReferenceError
  useEffect(() => {
    if (showCalendarModal || showAuthModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showCalendarModal, showAuthModal]);

  useEffect(() => {
    if (suggestions.length === 0) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(target) &&
        suggestionsDropdownRef.current &&
        !suggestionsDropdownRef.current.contains(target) &&
        // Don't close if clicking on search results
        !(target as Element).closest('[data-search-results]')
      ) {
        setSuggestions([]);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [suggestions]);

  // Helper function to label slot dates as Today, Tomorrow, or the actual date
  function capitalizeMonth(dateStr: string) {
    return dateStr.replace(/\b([a-z])/g, (match, p1, offset) => {
      if (offset > 0 && dateStr[offset - 1] === " ") {
        return p1.toUpperCase();
      }
      return match;
    });
  }

  // Helper to filter out past slots
  function isTodayOrFuture(slotDateStr: string) {
    const slotDate = dayjs(
      capitalizeMonth(slotDateStr) + " " + dayjs().year(),
      "DD MMMM YYYY"
    );
    const today = dayjs().startOf("day");
    return (
      slotDate.isValid() &&
      (slotDate.isSame(today, "day") || slotDate.isAfter(today, "day"))
    );
  }

  // Helper function to sort time slots by date
  const sortTimeSlotsByDate = (
    timeSlots: {
      date: string;
      availableSlots: number;
      sessions: { morning: string[]; evening: string[] };
    }[]
  ) => {
    if (!timeSlots || !Array.isArray(timeSlots)) return [];

    return [...timeSlots].sort((a, b) => {
      const dateA = dayjs(
        capitalizeMonth(a.date) + " " + dayjs().year(),
        "DD MMMM YYYY"
      );
      const dateB = dayjs(
        capitalizeMonth(b.date) + " " + dayjs().year(),
        "DD MMMM YYYY"
      );

      // Handle invalid dates by putting them at the end
      if (!dateA.isValid() && !dateB.isValid()) return 0;
      if (!dateA.isValid()) return 1;
      if (!dateB.isValid()) return -1;

      return dateA.valueOf() - dateB.valueOf();
    });
  };

  // CalendarModal component defined inside to access helper functions
  const CalendarModal = ({
    doctor,
    onClose,
  }: {
    doctor: Doctor;
    onClose: () => void;
  }) => {
    const futureSlots = sortTimeSlotsByDate(
      doctor.timeSlots?.filter((ts) => isTodayOrFuture(ts.date)) || []
    );
    const today = dayjs().startOf("day");
    const hasTodaySlot = futureSlots.some((ts) => {
      const slotDate = dayjs(
        capitalizeMonth(ts.date) + " " + dayjs().year(),
        "DD MMMM YYYY"
      );
      return slotDate.isSame(today, "day") && ts.availableSlots > 0;
    });

    return (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      style={{ overflow: "hidden" }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 p-6 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Available Appointments
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-105"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              {doctor.user.name}
            </h3>
            <p className="text-blue-600 font-medium">{doctor.degree}</p>
          </div>

            {futureSlots.length > 0 ? (
                <div className="space-y-4">
                  {futureSlots.map((timeSlot, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-2xl p-5 bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-gray-800 text-lg">
                          {(() => {
                            const slotDate = dayjs(
                              capitalizeMonth(timeSlot.date) +
                              " " +
                              dayjs().year(),
                              "DD MMMM YYYY"
                            );
                            const today = dayjs().startOf("day");
                            const tomorrow = today.add(1, "day");
                            if (slotDate.isSame(today, "day")) return "Today";
                            if (slotDate.isSame(tomorrow, "day"))
                              return "Tomorrow";
                            return slotDate.isValid()
                              ? slotDate.format("DD MMMM")
                              : timeSlot.date;
                          })()}
                        </h4>
                        <span className="text-sm font-medium text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 hover:scale-105 font-medium shadow-sm"
                        >
                          {timeSlot.availableSlots} slots available
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {timeSlot.sessions.morning?.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              Morning
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {timeSlot.sessions.morning.map(
                                (slot: string, slotIndex: number) => (
                                  <button
                                    key={slotIndex}
                                    className="px-4 py-2 bg-blue-50 text-blue-800 rounded-full text-sm border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 hover:scale-105 font-medium shadow-sm"
                                  >
                                    {slot}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        )}
                        {timeSlot.sessions.evening?.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              Evening
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {timeSlot.sessions.evening.map(
                                (slot: string, slotIndex: number) => (
                                  <button
                                    key={slotIndex}
                                    className="px-4 py-2 bg-orange-50 text-orange-800 rounded-full text-sm border border-orange-200 hover:bg-orange-100 hover:border-orange-300 transition-all duration-200 hover:scale-105 font-medium shadow-sm"
                                  >
                                    {slot}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {hasTodaySlot && (
                    <div className="text-center py-4">
                      <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold text-lg border border-green-200">
                        Available Today
                      </span>
                    </div>
                  )}
                </div>
            ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg">
                    No time slots available
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Please check back later
                  </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
  };

  return (
    <div>
      <Head>
        <title>ZEVA Doctor Directory – Find Verified Ayurveda Doctors Near You</title>
        <meta
          name="description"
          content="Discover verified Ayurveda doctors and medical specialists with transparent fees, patient reviews, and easy booking. Find trusted healthcare providers near you."
        />
        <meta
          name="keywords"
          content="ZEVA doctor directory, Ayurveda doctors near me, verified Ayurveda doctors, Ayurveda specialists, book Ayurveda doctor, trusted medical specialists, transparent consultation fees, Ayurveda healthcare, online doctor booking, find Ayurveda doctor"
        />
        <meta property="og:title" content="ZEVA Doctor Directory – Find Verified Ayurveda Doctors Near You" />
        <meta
          property="og:description"
          content="Discover verified Ayurveda doctors and medical specialists with transparent fees, patient reviews, and easy booking. Find trusted healthcare providers near you."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ZEVA Doctor Directory – Find Verified Ayurveda Doctors Near You" />
        <meta
          name="twitter:description"
          content="Discover verified Ayurveda doctors and medical specialists with transparent fees, patient reviews, and easy booking. Find trusted healthcare providers near you."
        />
        <link rel="canonical" href="https://zeva360.com/doctor/search" />
        {/* Schema Markup - Search Doctor Directory */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "Search Doctor Directory",
              "url": "https://zeva360.com/doctor/search",
              "description": "Find verified Ayurveda doctors and medical specialists near you with ZEVA. Search by specialty, doctor name, or location to access authentic treatments, transparent consultation fees, and real patient reviews.",
              "publisher": {
                "@type": "Organization",
                "name": "ZEVA",
                "url": "https://zeva360.com",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://zeva360.com/logo.png"
                }
              },
              "about": {
                "@type": "MedicalOrganization",
                "name": "Verified Doctors & Medical Specialists",
                "description": "Trusted medical professionals providing authentic treatments across various specialties with transparent consultation fees and verified credentials."
              },
              "mainEntity": {
                "@type": "Website",
                "name": "Search Doctor Directory",
                "url": "https://zeva360.com/search-doctor",
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://zeva360.com/search-doctor?query={search_term_string}",
                  "query-input": "required name=search_term_string"
                }
              }
            })
          }}
        />
      </Head>
      <div className="min-h-screen bg-[#f8fafc]">
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleAuthModalClose}
        onSuccess={handleAuthSuccess}
        initialMode={authModalMode}
      />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { fontSize: "0.9rem" },
        }}
      />

      {showCalendarModal && selectedDoctor && (
        <CalendarModal
          doctor={selectedDoctor}
          onClose={() => setShowCalendarModal(false)}
        />
      )}

      {/* Professional Header Section */}
      <div className="w-full bg-gradient-to-br from-white via-[#f8fafc] to-[#f0f7ff] border-b border-[#e2e8f0] shadow-sm sticky top-0 z-60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Professional Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mr-3 bg-gradient-to-br from-[#0284c7] via-[#0ea5e9] to-[#06b6d4] shadow-lg">
                <Stethoscope className="w-6 h-6 text-white" />
                </div>
              <div className="text-left">
                <h1 className="text-2xl mt-7 sm:text-3xl lg:text-4xl font-bold text-[#1e293b] tracking-tight">
                  ZEVA Doctor Directory
                </h1>
                <p className="text-xs sm:text-sm text-[#64748b] mt-0.5">
                Trusted Ayurveda Doctors & Medical Specialists

                </p>
              </div>
            </div>
            <p className="text-sm sm:text-base text-[#475569] max-w-2xl mx-auto mt-3">
            ZEVA Doctor Directory connects you with verified Ayurveda doctors and medical specialists, offering authentic care, transparent fees, and trusted patient reviews—making it easy to find the right doctor quickly and reliably.
</p>
            </div>


          {/* Professional Search Interface */}
          <div className="w-full max-w-6xl mx-auto" style={{ position: 'relative', zIndex: 100 }}>
            {/* Quick Filter Chips - Dynamic Specialties */}
            {specialties.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {specialties.map((specialty) => (
                  <button
                    key={specialty}
                    onClick={async () => {
                      // If clicking the same specialty again, don't change location
                      const isSameSpecialty = selectedService === specialty;
                      
                      // If clicking a different specialty, clear previous selection
                      if (!isSameSpecialty && selectedService) {
                        setDoctors([]);
                        setManualPlace("");
                        clearPersistedState();
                      }
                      
                      setQuery(specialty);
                      setSelectedService(specialty);
                      fetchSuggestions(specialty);
                      
                      // Automatically search for doctors with this specialty from DoctorProfile
                      try {
                        setLoading(true);
                        
                        // Only clear results if selecting a different specialty
                        if (!isSameSpecialty) {
                          setDoctors([]);
                          clearPersistedState();
                        }
                        
                        // Search doctors by treatment directly from DoctorProfile (no location required)
                        const res = await axios.get("/api/doctor/searchByTreatment", {
                          params: { treatment: specialty },
                        });

                        if (res.data.success && res.data.doctors) {
                          // Calculate distances if user location is available
                          const doctorsWithDistance = res.data.doctors.map((doctor: Doctor) => {
                            if (doctor.location?.coordinates?.length === 2 && userCurrentLocation) {
                              const doctorLng = doctor.location.coordinates[0];
                              const doctorLat = doctor.location.coordinates[1];
                              const distance = calculateDistance(
                                userCurrentLocation.lat,
                                userCurrentLocation.lng,
                                doctorLat,
                                doctorLng
                              );
                              return { ...doctor, distance };
                            }
                            return { ...doctor, distance: null };
                          });

                          // Sort by distance if available, otherwise keep original order
                          doctorsWithDistance.sort((a: Doctor, b: Doctor) => {
                            if (a.distance === null && b.distance === null) return 0;
                            if (a.distance === null) return 1;
                            if (b.distance === null) return -1;
                            return (a.distance || 0) - (b.distance || 0);
                          });

                          setDoctors(doctorsWithDistance);

                          // Do not auto-fill location from doctor address

                          // Fetch reviews for all doctors
                          doctorsWithDistance.forEach((doctor: Doctor) => {
                            if (doctor._id) {
                              fetchDoctorReviews(doctor._id);
                            }
                          });

                          // Update URL using only manualPlace if provided
                          updateURL(specialty, manualPlace.trim());
                        } else {
                          // No doctors found
                          setDoctors([]);
                          updateURL(specialty, 'all-doctors');
                        }
                      } catch (error) {
                        console.error("Error searching doctors:", error);
                        setDoctors([]);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className={`px-3 py-1.5 text-[10px] font-medium rounded-full border transition-all shadow-sm hover:shadow ${
                      selectedService === specialty
                        ? 'bg-gradient-to-r from-blue-100 to-purple-100 border-blue-400 text-blue-800'
                        : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-purple-100 hover:border-blue-300'
                    }`}
                    // className="px-3 py-1.5 text-[10px] font-medium rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 text-blue-700 hover:from-blue-100 hover:to-purple-100 hover:border-blue-300 transition-all shadow-sm hover:shadow"
                  >
                    {specialty}
                  </button>
                ))}
              </div>
            )}
            {specialtiesLoading && (
              <div className="mb-3 flex flex-wrap gap-2">
                <div className="px-3 py-1.5 text-[10px] text-gray-500">Loading specialties...</div>
              </div>
            )}
           
            <div className="rounded-2xl p-4 sm:p-5 shadow-lg border border-[#e2e8f0] bg-white backdrop-blur-sm mb-6" style={{ position: 'relative', zIndex: 100 }}>
                {/* Desktop Layout */}
              <div className="hidden md:flex gap-3 items-center">
                {/* Search Input */}
                <div className="relative flex-1 max-w-lg" style={{ zIndex: 10001 }}>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Search className="h-5 w-5 text-[#0284c7]" />
                    </div>
                    <input
                      type="text"
                    placeholder="Specialties, or treatments..."
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        fetchSuggestions(e.target.value);
                      }}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="w-full pl-11 pr-4 py-3 text-[#1e293b] rounded-xl focus:ring-2 focus:ring-[#0284c7] focus:border-[#0284c7] transition-all placeholder:text-[#94a3b8] text-sm border-2 border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                      ref={searchInputRef}
                    />
                    {/* Desktop Suggestions Dropdown */}
                    {suggestions.length > 0 && (
                      <div
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-64 overflow-y-auto custom-scrollbar"
                        ref={suggestionsDropdownRef}
                        style={{ position: 'absolute', zIndex: 10002 }}
                      >
                        <div className="p-1">
                          {suggestions.map((s, i) => (
                            <div
                              key={i}
                              className="flex items-center px-3 py-2.5 hover:bg-[#f0f7ff] cursor-pointer transition-colors border-b border-[#f1f5f9] last:border-b-0 rounded group"
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                // Use the full value (subcategory or treatment) as displayed
                                const treatmentValue = s.value;
                                
                                // Auto-fill the search field and close dropdown immediately
                                setQuery(treatmentValue);
                                setSelectedService(treatmentValue);
                                setSuggestions([]); // Close dropdown immediately
                                searchInputRef.current?.blur();
                                
                                clearPersistedState();
                                
                                // Search doctors by treatment directly from DoctorProfile (no location required)
                                try {
                                  setLoading(true);
                                  setDoctors([]);
                                  
                                  const res = await axios.get("/api/doctor/searchByTreatment", {
                                    params: { treatment: treatmentValue },
                                  });

                                  if (res.data.success && res.data.doctors) {
                                    // Calculate distances if user location is available
                                    const doctorsWithDistance = res.data.doctors.map((doctor: Doctor) => {
                                      if (doctor.location?.coordinates?.length === 2 && userCurrentLocation) {
                                        const doctorLng = doctor.location.coordinates[0];
                                        const doctorLat = doctor.location.coordinates[1];
                                        const distance = calculateDistance(
                                          userCurrentLocation.lat,
                                          userCurrentLocation.lng,
                                          doctorLat,
                                          doctorLng
                                        );
                                        return { ...doctor, distance };
                                      }
                                      return { ...doctor, distance: null };
                                    });

                                    // Sort by distance if available
                                    doctorsWithDistance.sort((a: Doctor, b: Doctor) => {
                                      if (a.distance === null && b.distance === null) return 0;
                                      if (a.distance === null) return 1;
                                      if (b.distance === null) return -1;
                                      return (a.distance || 0) - (b.distance || 0);
                                    });

                                    setDoctors(doctorsWithDistance);

                                    // Do not auto-fill location from doctor address

                                    // Fetch reviews for all doctors
                                    doctorsWithDistance.forEach((doctor: Doctor) => {
                                      if (doctor._id) {
                                        fetchDoctorReviews(doctor._id);
                                      }
                                    });

                                    // Update URL using only manualPlace if provided
                                    updateURL(treatmentValue, manualPlace.trim());
                                  } else {
                                    setDoctors([]);
                                    updateURL(treatmentValue, 'all-doctors');
                                  }
                                } catch (error) {
                                  console.error("Error searching doctors:", error);
                                  setDoctors([]);
                                } finally {
                                  setLoading(false);
                                }
                              }}
                            >
                              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center mr-3">
                                <HeartPulse className="w-4 h-4 text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-[#1e293b] group-hover:text-[#0284c7] transition-colors text-sm truncate">
                                  {s.value}
                                </p>
                                <p className="text-xs text-gray-500 capitalize mt-0.5">
                                  {s.type}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                {/* Separator */}
                <div className="h-10 w-px bg-gradient-to-b from-transparent via-[#cbd5e1] to-transparent"></div>

                {/* Location Input */}
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <MapPin className="h-5 w-5 text-[#0284c7]" />
                    </div>
                    <input
                    placeholder="Enter city, area, or landmark..."
                      value={manualPlace}
                      onChange={(e) => setManualPlace(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && searchByPlace()}
                    className="w-full pl-11 pr-4 py-3 text-[#1e293b] rounded-xl focus:ring-2 focus:ring-[#0284c7] focus:border-[#0284c7] transition-all placeholder:text-[#94a3b8] text-sm border-2 border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                  />
                  </div>

                {/* Near Me Button */}
                  <button
                    onClick={locateMe}
                    disabled={loading}
                  className="flex items-center px-4 py-3 bg-[#f8fafc] text-[#475569] rounded-xl hover:bg-[#f1f5f9] transition-all text-sm font-medium border-2 border-[#e2e8f0] hover:border-[#cbd5e1] disabled:opacity-50 shadow-sm"
                  title="Use Current Location"
                  >
                  <Navigation className="w-4 h-4 mr-1.5" />
                  <span className="hidden lg:inline">Near Me</span>
                  </button>

                {/* Search Button */}
                  <button
                    onClick={handleSearch}
                  className="px-6 py-3 text-white rounded-xl font-semibold bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] hover:from-[#0369a1] hover:to-[#0284c7] transition-all text-sm shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    Search
                  </button>
                </div>

                {/* Mobile Layout */}
              <div className="md:hidden space-y-3">
                {/* Search Input with Near Me */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1" style={{ zIndex: 10001 }}>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <Search className="h-5 w-5 text-[#0284c7]" />
                      </div>
                      <input
                        type="text"
                      placeholder="Search doctors or specialties..."
                        value={query}
                        onChange={(e) => {
                          setQuery(e.target.value);
                          fetchSuggestions(e.target.value);
                        }}
                        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      className="w-full pl-11 pr-3 py-3 text-[#1e293b] rounded-xl focus:ring-2 focus:ring-[#0284c7] focus:border-[#0284c7] transition-all placeholder:text-[#94a3b8] text-sm border-2 border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                        ref={searchInputRef}
                      />
                      {/* Mobile Suggestions Dropdown */}
                      {suggestions.length > 0 && (
                        <div
                          className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-64 overflow-y-auto custom-scrollbar"
                          ref={suggestionsDropdownRef}
                          style={{ position: 'absolute', zIndex: 10002 }}
                        >
                          <div className="p-1">
                            {suggestions.map((s, i) => (
                            <div
                              key={i}
                              className="flex items-center px-3 py-2.5 hover:bg-[#f0f7ff] cursor-pointer transition-colors border-b border-[#f1f5f9] last:border-b-0 rounded group"
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                // Use the full value (subcategory or treatment) as displayed
                                const treatmentValue = s.value;
                                
                                // Auto-fill the search field and close dropdown immediately
                                setQuery(treatmentValue);
                                setSelectedService(treatmentValue);
                                setSuggestions([]); // Close dropdown immediately
                                searchInputRef.current?.blur();
                                
                                clearPersistedState();
                                
                                // Search doctors by treatment directly from DoctorProfile (no location required)
                                try {
                                  setLoading(true);
                                  setDoctors([]);
                                  
                                  const res = await axios.get("/api/doctor/searchByTreatment", {
                                    params: { treatment: treatmentValue },
                                  });

                                  if (res.data.success && res.data.doctors) {
                                    // Calculate distances if user location is available
                                    const doctorsWithDistance = res.data.doctors.map((doctor: Doctor) => {
                                      if (doctor.location?.coordinates?.length === 2 && userCurrentLocation) {
                                        const doctorLng = doctor.location.coordinates[0];
                                        const doctorLat = doctor.location.coordinates[1];
                                        const distance = calculateDistance(
                                          userCurrentLocation.lat,
                                          userCurrentLocation.lng,
                                          doctorLat,
                                          doctorLng
                                        );
                                        return { ...doctor, distance };
                                      }
                                      return { ...doctor, distance: null };
                                    });

                                    // Sort by distance if available
                                    doctorsWithDistance.sort((a: Doctor, b: Doctor) => {
                                      if (a.distance === null && b.distance === null) return 0;
                                      if (a.distance === null) return 1;
                                      if (b.distance === null) return -1;
                                      return (a.distance || 0) - (b.distance || 0);
                                    });

                                    setDoctors(doctorsWithDistance);

                                    // Do not auto-fill location from doctor address

                                    // Fetch reviews for all doctors
                                    doctorsWithDistance.forEach((doctor: Doctor) => {
                                      if (doctor._id) {
                                        fetchDoctorReviews(doctor._id);
                                      }
                                    });

                                    // Update URL using only manualPlace if provided
                                    updateURL(treatmentValue, manualPlace.trim());
                                  } else {
                                    setDoctors([]);
                                    updateURL(treatmentValue, 'all-doctors');
                                  }
                                } catch (error) {
                                  console.error("Error searching doctors:", error);
                                  setDoctors([]);
                                } finally {
                                  setLoading(false);
                                }
                              }}
                            >
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center mr-3">
                                  <HeartPulse className="w-4 h-4 text-purple-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                <p className="font-semibold text-[#1e293b] group-hover:text-[#0284c7] transition-colors text-sm truncate">
                                    {s.value}
                                  </p>
                                <p className="text-xs text-gray-500 capitalize mt-0.5">
                                    {s.type}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  {/* Near Me Button for Mobile */}
                    <button
                      type="button"
                      onClick={locateMe}
                      disabled={loading}
                    className="flex items-center justify-center px-3 py-3 bg-[#f8fafc] text-[#475569] rounded-xl hover:bg-[#f1f5f9] transition-all flex-shrink-0 border-2 border-[#e2e8f0] hover:border-[#cbd5e1] disabled:opacity-50 shadow-sm"
                    title="Use Current Location"
                    >
                    <Navigation className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Location Input */}
                  <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <MapPin className="h-5 w-5 text-[#0284c7]" />
                    </div>
                    <input
                    placeholder="Enter city, area, or landmark..."
                      value={manualPlace}
                      onChange={(e) => setManualPlace(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && searchByPlace()}
                    className="w-full pl-11 pr-3 py-3 text-[#1e293b] rounded-xl focus:ring-2 focus:ring-[#0284c7] focus:border-[#0284c7] transition-all placeholder:text-[#94a3b8] text-sm border-2 border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                  />
                  </div>

                  {/* Mobile Search Button */}
                    <button
                      onClick={handleSearch}
                  className="w-full px-6 py-3 text-white rounded-xl font-semibold bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] hover:from-[#0369a1] hover:to-[#0284c7] shadow-md hover:shadow-lg transition-all text-sm"
                    >
                  Search Doctors
                    </button>
                  </div>
                </div>
              </div>
          </div>
        </div>

      {/* Results Section - Always rendered to prevent collapsing */}
      <div className="w-full bg-gradient-to-b from-[#f8fafc] to-white" data-search-results style={{ minHeight: '400px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 pb-6" ref={resultsRef}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#e2e8f0] shadow-sm">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#e2e8f0] border-t-[#0284c7]"></div>
              <h3 className="mt-4 text-lg font-bold text-[#1e293b]">Searching for Doctors</h3>
              <p className="text-[#64748b] text-sm mt-2 text-center px-4">
                Please wait while we find the best Ayurveda specialists near you.
              </p>
            </div>
          ) : doctors.length > 0 ? (
            <div className="flex flex-col lg:flex-row gap-4">
            {/* Filters Sidebar */}
            <div className="lg:w-1/4">
                <div className="bg-white rounded-xl shadow-md border-2 border-[#e2e8f0] p-4 sticky top-4" style={{ zIndex: 10 }}>
                {/* Price Range Filter */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-[#1e293b] mb-3 flex items-center">
                      <BadgeIndianRupee className="w-4 h-4 mr-1.5 text-[#0284c7]" />
                      Price Range
                    </h3>
                  <div className="px-2">
                    {/* Price Display */}
                    <div className="flex justify-between items-center mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Min Price</p>
                        <p className="text-lg font-bold text-blue-500">₹ {priceRange[0].toLocaleString()}</p>
                      </div>
                      <div className="w-px h-8 bg-gray-300"></div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Max Price</p>
                        <p className="text-lg font-bold text-blue-500">₹ {priceRange[1].toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Separate Range Sliders */}
                    <div className="space-y-4">
                      {/* Min Price Slider */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum Price: ₹{priceRange[0].toLocaleString()}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="10000"
                          value={priceRange[0]}
                          onChange={(e) => {
                            const newMin = parseInt(e.target.value);
                            if (newMin < priceRange[1]) {
                              setPriceRange([newMin, priceRange[1]]);
                            }
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                          style={{
                            background: `linear-gradient(to right, #2D9AA5 0%, #2D9AA5 ${(priceRange[0] / 10000) * 100}%, #e5e7eb ${(priceRange[0] / 10000) * 100}%, #e5e7eb 100%)`
                          }}
                        />
                      </div>

                      {/* Max Price Slider */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Maximum Price: ₹{priceRange[1].toLocaleString()}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="10000"
                          value={priceRange[1]}
                          onChange={(e) => {
                            const newMax = parseInt(e.target.value);
                            if (newMax > priceRange[0]) {
                              setPriceRange([priceRange[0], newMax]);
                            }
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                          style={{
                            background: `linear-gradient(to right, #2D9AA5 0%, #2D9AA5 ${(priceRange[1] / 10000) * 100}%, #e5e7eb ${(priceRange[1] / 10000) * 100}%, #e5e7eb 100%)`
                          }}
                        />
                      </div>
                    </div>

                    {/* Price Labels */}
                    <div className="flex justify-between text-xs text-gray-500 mt-3">
                      <span>₹0</span>
                      <span>₹10,000</span>
                    </div>
                  </div>
                </div>

                {/* Sort By Filter - Compact */}
                <div className="mb-4">
                    <h3 className="text-xs font-bold text-[#1e293b] mb-2.5 flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1.5 text-[#0284c7]" />
                      Sort By
                    </h3>
                  <div className="space-y-1.5">
                    {[
                      { value: 'relevance', label: 'Relevance' },
                      { value: 'price-low-high', label: 'Price: Low to High' },
                      { value: 'price-high-low', label: 'Price: High to Low' },
                        { value: 'rating-high-low', label: 'Highest Rated' },
                        { value: 'experience-high-low', label: 'Most Experienced' }
                    ].map((option) => (
                        <label key={option.value} className="flex items-center cursor-pointer hover:bg-[#f8fafc] p-1 rounded transition-colors">
                        <input
                          type="radio"
                          name="sortBy"
                          value={option.value}
                          checked={sortBy === option.value}
                          onChange={(e) => setSortBy(e.target.value)}
                            className="w-4 h-4 text-[#0284c7] bg-white border-[#cbd5e1] focus:ring-[#0284c7] focus:ring-2"
                          />
                          <span className="ml-2 text-xs text-[#475569] font-medium">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Star Rating Filter - Compact */}
                  <div className="mb-4">
                    <h3 className="text-xs font-bold text-[#1e293b] mb-2.5 flex items-center">
                      <Star className="w-3.5 h-3.5 mr-1.5 text-[#0284c7]" />
                      Minimum Rating
                    </h3>
                  <div className="space-y-1.5">
                      {[5, 4, 3].map((rating) => (
                        <label key={rating} className="flex items-center cursor-pointer hover:bg-[#f8fafc] p-1 rounded transition-colors">
                        <input
                          type="radio"
                          name="rating"
                          value={rating}
                          checked={starFilter === rating}
                          onChange={(e) => setStarFilter(parseInt(e.target.value))}
                            className="w-3.5 h-3.5 text-[#0284c7] bg-white border-[#cbd5e1] focus:ring-[#0284c7] focus:ring-1"
                        />
                        <div className="ml-1.5 flex items-center">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                  className={`w-3 h-3 ${i < rating ? 'text-yellow-400 fill-current' : 'text-[#cbd5e1]'}`}
                              />
                            ))}
                          </div>
                            <span className="ml-1.5 text-[10px] text-[#475569] font-medium">& above</span>
                        </div>
                      </label>
                    ))}
                      <label className="flex items-center cursor-pointer hover:bg-[#f8fafc] p-1 rounded transition-colors">
                      <input
                        type="radio"
                        name="rating"
                        value={0}
                        checked={starFilter === 0}
                        onChange={(e) => setStarFilter(parseInt(e.target.value))}
                          className="w-3.5 h-3.5 text-[#0284c7] bg-white border-[#cbd5e1] focus:ring-[#0284c7] focus:ring-1"
                      />
                        <span className="ml-1.5 text-[10px] text-[#475569] font-medium">All Ratings</span>
                    </label>
                  </div>
                </div>

                {/* Clear Filters Button - Compact */}
                  <div className="pt-2 border-t border-[#e2e8f0]">
                  <button
                    onClick={clearFilters}
                      className="w-full px-3 py-1.5 bg-[#dc2626] text-white rounded-lg hover:bg-[#b91c1c] transition-all text-[10px] font-semibold shadow-sm hover:shadow"
                  >
                      Clear All Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Doctors List */}
            <div className="lg:w-3/4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                <div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#1e293b] mb-1">
                      {filteredDoctors.length} {filteredDoctors.length === 1 ? 'Doctor' : 'Doctors'} Found
                  </h2>
                  {selectedService && (
                      <p className="text-sm text-[#64748b] flex items-center">
                        <span className="w-1.5 h-1.5 bg-[#0284c7] rounded-full mr-1.5"></span>
                        Showing results for &quot;<span className="font-medium text-[#0284c7]">{selectedService}</span>&quot;
                    </p>
                  )}
                </div>

                  {doctors.length > 0 && (
                    <button
                      onClick={clearSearch}
                      className="px-4 py-2 rounded-lg border-2 border-[#e2e8f0] text-[#475569] hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-all text-sm font-medium flex items-center shadow-sm"
                    >
                      <X className="w-4 h-4 mr-1.5" />
                      Clear Search
                    </button>
                  )}
              </div>

              {filteredDoctors.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 sm:p-8">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 rounded-full bg-[#f0f7ff] flex items-center justify-center mx-auto mb-3">
                        <Search className="w-8 h-8 text-[#0284c7]" />
                  </div>
                      <h3 className="text-lg sm:text-xl font-bold text-[#1e293b] mb-2">
                        No Doctors Found
                  </h3>
                      <p className="text-sm text-[#64748b] mb-1">
                        Try adjusting your search criteria or filters
                      </p>
                    </div>
                   
                    {/* Professional ZEVA Doctors Information Section */}
                    <div className="bg-gradient-to-br from-[#f0f7ff] via-[#e0f2fe] to-[#bae6fd] rounded-xl p-6 sm:p-8 border border-[#cbd5e1] shadow-sm">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0284c7] to-[#0ea5e9] flex items-center justify-center mr-3 shadow-md">
                          <Stethoscope className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b]">
                            ZEVA Healthcare Trust
                          </h2>
                          <p className="text-xs sm:text-sm text-[#64748b] mt-0.5">
                            Your Trusted Ayurveda Doctor Platform
                          </p>
                        </div>
                      </div>
                     
                      <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                          <div className="flex items-start mb-2">
                            <Shield className="w-5 h-5 text-[#0284c7] mr-2 flex-shrink-0 mt-0.5" />
                            <div>
                              <h3 className="text-sm font-bold text-[#1e293b] mb-1">Verified Doctors</h3>
                              <p className="text-xs text-[#475569] leading-relaxed">
                                All listed doctors are verified and authenticated Ayurveda practitioners with proper certifications and medical credentials
                              </p>
                            </div>
                          </div>
                        </div>
                       
                        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                          <div className="flex items-start mb-2">
                            <Star className="w-5 h-5 text-[#0284c7] mr-2 flex-shrink-0 mt-0.5" />
                            <div>
                              <h3 className="text-sm font-bold text-[#1e293b] mb-1">Patient Reviews</h3>
                              <p className="text-xs text-[#475569] leading-relaxed">
                                Real patient reviews and ratings help you make informed decisions about your healthcare provider
                              </p>
                            </div>
                          </div>
                        </div>
                       
                        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                          <div className="flex items-start mb-2">
                            <BadgeIndianRupee className="w-5 h-5 text-[#0284c7] mr-2 flex-shrink-0 mt-0.5" />
                            <div>
                              <h3 className="text-sm font-bold text-[#1e293b] mb-1">Transparent Fees</h3>
                              <p className="text-xs text-[#475569] leading-relaxed">
                                Clear consultation fees displayed upfront - no hidden charges or surprise costs
                              </p>
                            </div>
                          </div>
                        </div>
                       
                        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                          <div className="flex items-start mb-2">
                            <Clock className="w-5 h-5 text-[#0284c7] mr-2 flex-shrink-0 mt-0.5" />
                            <div>
                              <h3 className="text-sm font-bold text-[#1e293b] mb-1">Appointment Availability</h3>
                              <p className="text-xs text-[#475569] leading-relaxed">
                                View real-time appointment slots and availability to book consultations easily
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                     
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-5 border border-white/50">
                        <h3 className="text-base font-bold text-[#1e293b] mb-3 text-center">Why Choose ZEVA Doctors?</h3>
                        <div className="grid sm:grid-cols-2 gap-3 text-xs text-[#475569]">
                          <div className="flex items-start">
                            <span className="text-[#0284c7] font-bold mr-2 text-base">•</span>
                            <span>
Verified Doctors – Every doctor is thoroughly verified with proper certifications, credentials, and experience.


</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-[#0284c7] font-bold mr-2 text-base">•</span>
                            <span>Patient Reviews – Read real feedback and ratings from verified patients to make informed choices.



</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-[#0284c7] font-bold mr-2 text-base">•</span>
                            <span>Transparent Fees – Clear consultation charges with no hidden costs.
                            </span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-[#0284c7] font-bold mr-2 text-base">•</span>
                      <span>Easy Booking – View availability and schedule appointments in just a few clicks.
                      </span>
                          </div>
                        </div>
                      </div>
                     
                      <div className="mt-5 pt-5 border-t border-[#cbd5e1]">
                        <p className="text-sm text-[#475569] text-center leading-relaxed">
                          <strong className="text-[#1e293b]">Search Tip:</strong> Try searching by location (city, area), specialty (Panchakarma, Abhyanga), or doctor name to discover the best Ayurveda healthcare professionals in your area.
                        </p>
                      </div>
                    </div>
                </div>
              ) : (
                <>
                  {(() => {
                    const pageSize = 6;
                    const totalPages = Math.ceil(filteredDoctors.length / pageSize);
                    const paginatedDoctors = filteredDoctors.slice((currentPage - 1) * pageSize, currentPage * pageSize);
                    
                    return (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {paginatedDoctors.map((doctor, index) => {
                    // const hasRating = doctorReviews[doctor._id]?.totalReviews > 0;
                    const reviewsLoaded = doctorReviews[doctor._id] !== undefined;

                    return (
                      <div
                        key={index}
                        className="flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group h-full"
                      >
                        {/* Doctor Image Container */}
                        <div className="relative h-48 w-full overflow-hidden">
                          {doctor.photos?.[0] ? (
                            <Image
                              src={normalizeImagePath(doctor.photos[0])}
                              alt={doctor.user?.name || "Doctor Image"}
                              fill
                              className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <div className="text-center">
                                <div className="w-12 h-12 bg-teal-800 rounded-full flex items-center justify-center mx-auto mb-2">
                                  <Stethoscope className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-sm text-teal-800 font-medium">
                                  {doctor.user?.name?.split(" ")[0]}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {/* Badge Overlay */}
                          <span className="absolute top-3 left-3 bg-amber-300 px-3 py-1 rounded-full text-xs font-semibold z-20">
                            {doctorReviews[doctor._id]?.averageRating >= 4.8 ? "Top Rated" : "Most Booked"}
                          </span>

                          {/* Verified Overlay */}
                          {doctor.verified && (
                            <span className="absolute top-3 right-3 w-8 h-8 bg-teal-800 text-white rounded-full flex items-center justify-center z-20">
                              <Shield className="w-4 h-4" />
                            </span>
                          )}

                          {/* Distance Overlay */}
                          {doctor.distance && (
                            <div className="absolute bottom-3 left-3 bg-teal-800 text-white px-2 py-1 rounded-md text-[10px] font-bold flex items-center z-20">
                              <Navigation className="w-2.5 h-2.5 mr-1" />
                              {formatDistance(doctor.distance)}
                            </div>
                          )}
                        </div>

                        {/* Doctor Info */}
                        <div className="p-4 flex-1 flex flex-col">
                          <div className="flex justify-between gap-2 items-start">
                            <div className="font-bold text-gray-900 text-lg line-clamp-1 group-hover:text-teal-800 transition-colors">
                              {doctor.user?.name}
                            </div>
                            <div className="text-amber-500 text-sm font-bold whitespace-nowrap flex items-center gap-1">
                              <Star className="w-4 h-4 fill-current" />
                              {reviewsLoaded ? (doctorReviews[doctor._id]?.averageRating || 0).toFixed(1) : "0.0"}
                            </div>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {doctor.treatments && doctor.treatments.length > 0 ? (
                              doctor.treatments.slice(0, 2).map((t: any) => (
                                <span
                                  key={t.mainTreatmentSlug}
                                  className="text-[10px] px-2 py-1 bg-teal-50 text-teal-800 rounded-full font-medium"
                                >
                                  {t.mainTreatment}
                                </span>
                              ))
                            ) : (
                              <>
                                <span className="text-[10px] px-2 py-1 bg-teal-50 text-teal-800 rounded-full font-medium">
                                  {doctor.degree || "Healthcare"}
                                </span>
                                <span className="text-[10px] px-2 py-1 bg-teal-50 text-teal-800 rounded-full font-medium">
                                  Wellness
                                </span>
                              </>
                            )}
                          </div>

                          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 text-teal-800 shrink-0" />
                            <span className="truncate">{doctor.address}</span>
                          </div>

                          {/* Fee and Actions */}
                          <div className="mt-auto pt-4 flex justify-between items-center">
                            <div>
                              <div className="text-[10px] text-gray-500 font-medium">Starting from</div>
                              <div className="font-bold text-blue-700 text-sm">
                                {typeof doctor.consultationFee === "number" && doctor.consultationFee > 0 
                                  ? `AED ${doctor.consultationFee}` 
                                  : "AED —"}
                              </div>
                            </div>
                            
                            <div className="flex gap-2 items-center">
                              {(() => {
                                const mapsHref = doctor.address
                                  ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(doctor.address)}`
                                  : doctor.location?.coordinates?.length === 2
                                  ? `https://www.google.com/maps/dir/?api=1&destination=${doctor.location.coordinates[1]},${doctor.location.coordinates[0]}`
                                  : null;
                               
                                return mapsHref ? (
                                  <a
                                    href={mapsHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-8 h-8 flex items-center justify-center bg-teal-800 text-white rounded-full hover:bg-teal-900 transition-all shadow-sm"
                                    title="Get Directions"
                                  >
                                    <MapPin className="w-4 h-4" />
                                  </a>
                                ) : null;
                              })()}
                              
                              <a
                                href={(doctor as any).slug && (doctor as any).slugLocked
                                  ? `/doctor/${(doctor as any).slug}`
                                  : `/doctor/${doctor._id}`}
                                className="bg-amber-300 px-4 py-2 rounded-xl text-xs font-bold text-gray-900 hover:bg-amber-400 transition-all shadow-sm"
                              >
                                View Details
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                          })}
                        </div>

                        {/* Pagination Controls - Arrow Icons Only */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-center gap-2 mt-6 pb-6">
                            <button
                              onClick={() => {
                                setCurrentPage(prev => Math.max(1, prev - 1));
                                if (resultsRef.current) {
                                  resultsRef.current.scrollIntoView({ 
                                    behavior: 'smooth', 
                                    block: 'start' 
                                  });
                                }
                              }}
                              disabled={currentPage === 1}
                              className="p-2 rounded-full border border-gray-200 bg-white hover:bg-cyan-50 hover:border-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 transition-all"
                              title="Previous"
                            >
                              <ChevronLeft className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => {
                                setCurrentPage(prev => Math.min(totalPages, prev + 1));
                                if (resultsRef.current) {
                                  resultsRef.current.scrollIntoView({ 
                                    behavior: 'smooth', 
                                    block: 'start' 
                                  });
                                }
                              }}
                              disabled={currentPage === totalPages}
                              className="p-2 rounded-full border border-gray-200 bg-white hover:bg-cyan-50 hover:border-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 transition-all"
                              title="Next"
                            >
                              <ChevronRight className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
          ) : (selectedService || query.trim()) ? (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 sm:p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#f0f7ff] flex items-center justify-center mx-auto mb-3">
                  <Search className="w-8 h-8 text-[#0284c7]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#1e293b] mb-2">
                  No Doctors Found
                </h3>
                <p className="text-sm text-[#64748b] mb-1">
                  Try adjusting your search criteria or filters
                </p>
              </div>
             
              {/* Professional ZEVA Doctors Information Section */}
              <div className="bg-gradient-to-br from-[#f0f7ff] via-[#e0f2fe] to-[#bae6fd] rounded-xl p-6 sm:p-8 border border-[#cbd5e1] shadow-sm">
              <div className="flex flex-col sm:flex-row items-center sm:items-start mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0284c7] to-[#0ea5e9] flex items-center justify-center mr-0 sm:mr-4 mb-4 sm:mb-0 shadow-lg">
                  <Stethoscope className="w-8 h-8 text-white" />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#1e293b] mb-2">
                    ZEVA Healthcare Trust
                  </h2>
                  <p className="text-sm sm:text-base text-[#64748b]">
                    Your trusted platform for authentic Ayurveda healthcare. We connect patients with verified doctors, ensuring quality care and transparent services.
                  </p>
                </div>
              </div>
             
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm">
                  <Shield className="w-6 h-6 text-[#0284c7] mb-2" />
                  <h3 className="text-sm font-bold text-[#1e293b] mb-1">Verified Doctors</h3>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    All doctors are verified with proper certifications and credentials
                  </p>
                </div>
               
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm">
                  <Star className="w-6 h-6 text-[#0284c7] mb-2" />
                  <h3 className="text-sm font-bold text-[#1e293b] mb-1">Patient Reviews</h3>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    Real reviews and ratings from verified patients
                  </p>
                </div>
               
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm">
                  <BadgeIndianRupee className="w-6 h-6 text-[#0284c7] mb-2" />
                  <h3 className="text-sm font-bold text-[#1e293b] mb-1">Transparent Fees</h3>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    Clear consultation fees with no hidden charges
                  </p>
                </div>
               
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm">
                  <Clock className="w-6 h-6 text-[#0284c7] mb-2" />
                  <h3 className="text-sm font-bold text-[#1e293b] mb-1">Easy Booking</h3>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    View availability and book appointments easily
                  </p>
                </div>
              </div>
             
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-5 border border-white/50">
                <h3 className="text-lg font-bold text-[#1e293b] mb-4 text-center">Why Trust ZEVA Doctors?</h3>
                <div className="grid sm:grid-cols-2 gap-3 text-sm text-[#475569]">
                  <div className="flex items-start">
                    <span className="text-[#0284c7] font-bold mr-2 text-lg">✓</span>
                    <span>
Verified Doctors – Every doctor is thoroughly verified with proper certifications, credentials, and experience.


</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-[#0284c7] font-bold mr-2 text-lg">✓</span>
                    <span>Patient Reviews – Read real feedback and ratings from verified patients to make informed choices.



</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-[#0284c7] font-bold mr-2 text-lg">✓</span>
                    <span>Transparent Fees – Clear consultation charges with no hidden costs.
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-[#0284c7] font-bold mr-2 text-lg">✓</span>
                    <span>Easy Booking – View availability and schedule appointments in just a few clicks.
                    </span>
                  </div>
                </div>
              </div>
             
              <div className="mt-6 pt-6 border-t border-[#cbd5e1]">
                <p className="text-sm text-[#475569] text-center leading-relaxed max-w-3xl mx-auto">
                  <strong className="text-[#1e293b]">Get Started:</strong>

Take control of your healthcare today. Enter your location, use the “Near Me” feature, or search by specialty or doctor name to discover the best Ayurveda doctors and medical specialists near you. Experience convenient, transparent, and verified healthcare with ZEVA.






                </p>
              </div>
              </div>
             
              <div className="flex flex-col mt-5 sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={locateMe}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#1e293b] to-[#0f172a] text-white text-sm font-semibold hover:from-[#0f172a] hover:to-[#1e293b] transition-all shadow-md hover:shadow-lg flex items-center"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Use Near Me
                </button>
                <button
                  type="button"
                  onClick={() => searchInputRef.current?.focus()}
                  className="px-6 py-3 rounded-xl border-2 border-[#e2e8f0] text-[#475569] text-sm font-semibold hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-all"
                >
                  Start Searching
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-8 sm:p-12">
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#f0f7ff] to-[#e0f2fe] flex items-center justify-center mx-auto mb-4 shadow-md">
                  <Stethoscope className="w-10 h-10 text-[#0284c7]" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#1e293b] mb-3">
                  Welcome to ZEVA Doctor Directory
                </h2>
                <p className="text-base text-[#475569] max-w-2xl mx-auto mb-6">
                  Discover trusted Ayurveda doctors and medical specialists in your area. Search by location, specialty, or doctor name to find the best healthcare providers.
                </p>
              </div>
             
              {/* Professional ZEVA Information Section */}
              <div className="bg-gradient-to-br from-[#f0f7ff] via-[#e0f2fe] to-[#bae6fd] rounded-xl p-6 sm:p-8 border border-[#cbd5e1] shadow-sm mb-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0284c7] to-[#0ea5e9] flex items-center justify-center mr-0 sm:mr-4 mb-4 sm:mb-0 shadow-lg">
                    <Stethoscope className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <h2 className="text-2xl sm:text-3xl font-bold text-[#1e293b] mb-2">
                      ZEVA Healthcare Trust
                    </h2>
                    <p className="text-sm sm:text-base text-[#64748b]">
                      Your trusted platform for authentic Ayurveda healthcare. We connect patients with verified doctors, ensuring quality care and transparent services.
                    </p>
                  </div>
                </div>
               
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm">
                    <Shield className="w-6 h-6 text-[#0284c7] mb-2" />
                    <h3 className="text-sm font-bold text-[#1e293b] mb-1">Verified Doctors</h3>
                    <p className="text-xs text-[#475569] leading-relaxed">
                      All doctors are verified with proper certifications and credentials
                    </p>
                  </div>
                 
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm">
                    <Star className="w-6 h-6 text-[#0284c7] mb-2" />
                    <h3 className="text-sm font-bold text-[#1e293b] mb-1">Patient Reviews</h3>
                    <p className="text-xs text-[#475569] leading-relaxed">
                      Real reviews and ratings from verified patients
                    </p>
                  </div>
                 
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm">
                    <BadgeIndianRupee className="w-6 h-6 text-[#0284c7] mb-2" />
                    <h3 className="text-sm font-bold text-[#1e293b] mb-1">Transparent Fees</h3>
                    <p className="text-xs text-[#475569] leading-relaxed">
                      Clear consultation fees with no hidden charges
                    </p>
                  </div>
                 
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm">
                    <Clock className="w-6 h-6 text-[#0284c7] mb-2" />
                    <h3 className="text-sm font-bold text-[#1e293b] mb-1">Easy Booking</h3>
                    <p className="text-xs text-[#475569] leading-relaxed">
                      View availability and book appointments easily
                    </p>
                  </div>
                </div>
               
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-5 border border-white/50">
                  <h3 className="text-lg font-bold text-[#1e293b] mb-4 text-center">Why Trust ZEVA Doctors?</h3>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm text-[#475569]">
                    <div className="flex items-start">
                      <span className="text-[#0284c7] font-bold mr-2 text-lg">✓</span>
                      <span>
Verified Doctors – Every doctor is thoroughly verified with proper certifications, credentials, and experience.


</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-[#0284c7] font-bold mr-2 text-lg">✓</span>
                      <span>Patient Reviews – Read real feedback and ratings from verified patients to make informed choices.



</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-[#0284c7] font-bold mr-2 text-lg">✓</span>
            <span>Transparent Fees – Clear consultation charges with no hidden costs.</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-[#0284c7] font-bold mr-2 text-lg">✓</span>
                      <span>Easy Booking – View availability and schedule appointments in just a few clicks.
                      </span>
                    </div>
                  </div>
                </div>
               
                <div className="mt-6 pt-6 border-t border-[#cbd5e1]">
                  <p className="text-sm text-[#475569] text-center leading-relaxed max-w-3xl mx-auto">
                    <strong className="text-[#1e293b]">Get Started:</strong>

Take control of your healthcare today. Enter your location, use the “Near Me” feature, or search by specialty or doctor name to discover the best Ayurveda doctors and medical specialists near you. Experience convenient, transparent, and verified healthcare with ZEVA.






                  </p>
                </div>
              </div>
             
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={locateMe}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#1e293b] to-[#0f172a] text-white text-sm font-semibold hover:from-[#0f172a] hover:to-[#1e293b] transition-all shadow-md hover:shadow-lg flex items-center"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Use Near Me
                </button>
                
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
