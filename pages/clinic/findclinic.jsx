"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import {
    MapPin,
    Search,
    Star,
    Clock,
    Navigation,
    Shield,
    X,
    Camera,
    BadgeIndianRupee,
    Filter,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import AuthModal from "../../components/AuthModal";
import Image from "next/image";
import { HeartPulse} from "lucide-react";

export default function Home() {
    const [query, setQuery] = useState("");
    const resultsRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [suggestions, setSuggestions] = useState([]);
    const [selectedService, setSelectedService] = useState("");
    const [clinics, setClinics] = useState([]);
    const [coords, setCoords] = useState(null); // Searched location coordinates
    const [userCurrentLocation, setUserCurrentLocation] = useState(null); // User's actual current location
    const [ratingFilter, setRatingFilter] = useState(0);
    const [manualPlace, setManualPlace] = useState("");
    const [loading, setLoading] = useState(false);
    const [clinicNames, setClinicNames] = useState([]);
    const [clinicNamesLoading, setClinicNamesLoading] = useState(true);
    const [specialties, setSpecialties] = useState([]);
    const [specialtiesLoading, setSpecialtiesLoading] = useState(true);

    // Auth Modal states
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authModalMode] = useState("login");
    const [pendingAction, setPendingAction] = useState(null);

    const router = useRouter();

    const [clinicReviews, setClinicReviews] = useState({});

    // Helper function to convert text to slug
    const textToSlug = (text) => {
        if (!text) return '';
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
    };

    // Helper function to convert slug back to readable text
    const slugToText = (slug) => {
        if (!slug) return '';
        return slug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Helper function to normalize image paths
    // Converts absolute Windows file paths to relative URLs
    const normalizeImagePath = (imagePath) => {
        if (!imagePath) return '';
       
        // Handle malformed URLs that have localhost concatenated with file path
        // e.g., "http://localhost:3000C:/Users/..." -> extract the file path part
        if (imagePath.includes('localhost') && /[A-Za-z]:/.test(imagePath)) {
            // Find the drive letter (C:, D:, etc.) and extract from there
            const driveMatch = imagePath.match(/([A-Za-z]:.*)/);
            if (driveMatch) {
                imagePath = driveMatch[1];
            }
        }
       
        // If it's already a relative path starting with /, clean up and return
        if (imagePath.startsWith('/')) {
            // Remove double slashes
            return imagePath.replace(/\/+/g, '/');
        }
       
        // If it's already a full URL (http:// or https://), return as is
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
       
        // If it's a Windows absolute path (C:/, D:/, etc.), extract the relative part
        if (/^[A-Za-z]:/.test(imagePath)) {
            // Find the uploads directory and extract everything from there
            const uploadsIndex = imagePath.indexOf('/uploads/');
            if (uploadsIndex !== -1) {
                const relativePath = imagePath.substring(uploadsIndex);
                // Remove double slashes
                return relativePath.replace(/\/+/g, '/');
            }
            // If uploads not found, try to extract from common paths
            const zevaIndex = imagePath.indexOf('ZEVA/');
            if (zevaIndex !== -1) {
                const afterZeva = imagePath.substring(zevaIndex + 5);
                const uploadsInAfter = afterZeva.indexOf('/uploads/');
                if (uploadsInAfter !== -1) {
                    const relativePath = afterZeva.substring(uploadsInAfter);
                    // Remove double slashes
                    return relativePath.replace(/\/+/g, '/');
                }
            }
        }
       
        // If it doesn't start with /, add it
        if (!imagePath.startsWith('/')) {
            // Remove double slashes before adding leading slash
            const cleaned = imagePath.replace(/\/+/g, '/');
            return '/' + cleaned.replace(/^\//, '');
        }
       
        // Remove double slashes
        return imagePath.replace(/\/+/g, '/');
    };

    // Store treatment slug when treatment is selected
    const [selectedTreatmentSlug, setSelectedTreatmentSlug] = useState(null);

    // Update URL with search parameters - ALWAYS use values from input fields
    const updateURL = (treatment, location, treatmentSlug = null) => {
        // Set flag to prevent useEffect from interfering
        isUpdatingURL.current = true;
       
        const params = new URLSearchParams();
        if (treatment) {
            // Use treatment slug from database if available, otherwise generate from name
            const slugToUse = treatmentSlug || selectedTreatmentSlug || textToSlug(treatment);
            params.set('treatment', slugToUse);
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

    const [isVisible, setIsVisible] = useState(false);

    // Add missing state variables for filters
    const [priceRange, setPriceRange] = useState([0, 40000]);
    const [selectedTimes, setSelectedTimes] = useState([]);
    const [sortBy, setSortBy] = useState('relevance');
    const [hasSearched, setHasSearched] = useState(false);
    const [formErrors, setFormErrors] = useState({ service: "", location: "" });
    const [quickFilters, setQuickFilters] = useState({
        verifiedOnly: false,
        hasPhotos: false,
        budgetFriendly: false,
    });
    const loadingToastId = useRef(null);
    const hasSearchedFromURL = useRef(false);
    const isUpdatingURL = useRef(false); // Flag to prevent useEffect from interfering during URL updates
    const [photoIndexByClinic, setPhotoIndexByClinic] = useState({});

    // Add the clearFilters function
    const clearFilters = () => {
        setPriceRange([0, 5000]);
        setSelectedTimes([]);
        setRatingFilter(0);
        setSortBy('relevance');
        setQuickFilters({
            verifiedOnly: false,
            hasPhotos: false,
            budgetFriendly: false,
        });
        toast.success("Filters cleared");
        // Don't clear search results, only reset filters
    };

    const parsePriceValue = (value) => {
        if (value === null || value === undefined) return 0;
        const numeric = parseInt(String(value).replace(/[^\d]/g, ""), 10);
        return Number.isNaN(numeric) ? 0 : numeric;
    };

    // Add the getSortedClinics function
    const getSortedClinics = (clinics) => {
        const sorted = [...clinics];

        switch (sortBy) {
            case 'price-low-high':
                return sorted.sort((a, b) => {
                    const priceA = parsePriceValue(a.pricing);
                    const priceB = parsePriceValue(b.pricing);
                    return priceA - priceB;
                });
            case 'price-high-low':
                return sorted.sort((a, b) => {
                    const priceA = parsePriceValue(a.pricing);
                    const priceB = parsePriceValue(b.pricing);
                    return priceB - priceA;
                });
            case 'rating-high-low':
                return sorted.sort((a, b) => {
                    const ratingA = clinicReviews[a._id]?.averageRating || 0;
                    const ratingB = clinicReviews[b._id]?.averageRating || 0;
                    return ratingB - ratingA;
                });
            case 'experience-high-low':
                // Since clinics don't have experience field, we'll sort by name
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            default:
                return sorted;
        }
    };

   //hey
    const availableTimes = [
        'Early Morning (4 AM - 6 AM)',
        'Morning (6 AM - 12 PM)',
        'Late Morning (10 AM - 12 PM)',
        'Afternoon (12 PM - 6 PM)',
        'Late Afternoon (3 PM - 6 PM)',
        'Evening (6 PM - 10 PM)',
        'Late Night (10 PM - 12 AM)',
        'Night (12 AM - 4 AM)',
        'Available Today',
        'Available Tomorrow',
        'Weekend Available'
    ];

    const quickFilterMeta = {
        verifiedOnly: {
            label: "Verified Clinics",
            description: "Show only verified or approved partners",
            icon: Shield,
        },
        hasPhotos: {
            label: "Photo Gallery",
            description: "Clinics with uploaded imagery",
            icon: Camera,
        },
        budgetFriendly: {
            label: "Budget Friendly",
            description: "Consultation fee under ₹500",
            icon: BadgeIndianRupee,
        },
    };

    const searchInputRef = useRef(null);
    const suggestionsDropdownRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            // Show button when scrolled down more than 100px
            setIsVisible(window.scrollY > 100);
        };

        window.addEventListener("scroll", handleScroll);

        // Cleanup
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (suggestions.length === 0) return;
        function handleClickOutside(event) {
            if (
                searchInputRef.current &&
                !searchInputRef.current.contains(event.target) &&
                suggestionsDropdownRef.current &&
                !suggestionsDropdownRef.current.contains(event.target)
            ) {
                setSuggestions([]);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [suggestions]);

    // Fetch clinic specialties on component mount
    useEffect(() => {
        const fetchSpecialties = async () => {
            try {
                setSpecialtiesLoading(true);
                const res = await axios.get("/api/clinic/specialties");
                if (res.data && res.data.success && res.data.specialties && Array.isArray(res.data.specialties)) {
                    setSpecialties(res.data.specialties);
                } else {
                    setSpecialties([]);
                }
            } catch (error) {
                console.error("Error fetching clinic specialties:", error);
                setSpecialties([]);
            } finally {
                setSpecialtiesLoading(false);
            }
        };
        fetchSpecialties();
    }, []);

    // Fetch clinic names on component mount
    useEffect(() => {
        const fetchClinicNames = async () => {
            try {
                setClinicNamesLoading(true);
                const res = await axios.get("/api/clinic/list");
                if (res.data.success && res.data.clinics) {
                    // Extract just the names for quick access
                    const names = res.data.clinics.map(clinic => clinic.name).filter(Boolean);
                    setClinicNames(names);
                }
            } catch (error) {
                console.error("Error fetching clinic names:", error);
                setClinicNames([]);
            } finally {
                setClinicNamesLoading(false);
            }
        };
        fetchClinicNames();
    }, []);

    // Load persisted search state from localStorage on component mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            // Check for session token
            let sessionToken = sessionStorage.getItem("ayurvedaSessionToken");
            if (!sessionToken) {
                // This is a new session (all tabs were closed)
                localStorage.removeItem("ayurvedaSearchState");
                // Generate and store a new session token
                sessionToken = Math.random().toString(36).substr(2, 9) + Date.now();
                sessionStorage.setItem("ayurvedaSessionToken", sessionToken);
            }
        }
        const loadPersistedState = () => {
            try {
                const persistedState = localStorage.getItem("ayurvedaSearchState");
                if (persistedState) {
                    const state = JSON.parse(persistedState);
                    // Check if state is not older than 24 hours
                    const now = Date.now();
                    const stateAge = now - (state.timestamp || 0);
                    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

                    if (stateAge < maxAge && state.clinics && state.clinics.length > 0) {
                        setClinics(state.clinics);
                        setHasSearched(true);
                        setCoords(state.coords);
                        setSelectedService(state.selectedService || "");
                        setManualPlace(state.manualPlace || "");
                        setCurrentPage(state.currentPage || 1);
                        setRatingFilter(state.ratingFilter || 0);

                        // Fetch reviews for all persisted clinics
                        state.clinics.forEach((clinic) => {
                            if (clinic._id) {
                                fetchReviewsForClinic(clinic._id);
                            }
                        });
                    } else {
                        // Clear expired state
                        clearPersistedState();
                    }
                }
            } catch {
                // console.error("Error loading persisted state:", error);
                clearPersistedState();
            }
        };

        loadPersistedState();
    }, []);

    // Recalculate distances when user location becomes available and clinics are already loaded
    useEffect(() => {
        if (userCurrentLocation && userCurrentLocation.lat && userCurrentLocation.lng && clinics.length > 0) {
            recalculateDistancesForClinics(userCurrentLocation.lat, userCurrentLocation.lng);
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
        if (!router.isReady || hasSearchedFromURL.current || isUpdatingURL.current) return; // Wait for router to be ready and prevent duplicate searches, and don't interfere during URL updates
       
        const { treatment, location } = router.query;
        if (treatment || location) {
            const treatmentText = treatment ? slugToText(String(treatment)) : '';
            const locationText = location ? slugToText(String(location)) : '';
            const rawLocation = location ? String(location).toLowerCase() : '';
           
            // On fresh mount (when hasSearchedFromURL is false), we want to trigger search from URL
            // even if we already loaded from localStorage, to ensure fresh results as requested.
            // This ensures that when a user returns to the page (e.g. via back button), the results are refreshed.
           
            if (locationText && rawLocation !== 'near-me') {
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
            } else if (rawLocation === 'near-me') {
                hasSearchedFromURL.current = true;
               
                // Handle near-me case
                if (treatmentText) {
                    setQuery(treatmentText);
                    setSelectedService(treatmentText);
                }
                // Trigger locateMe after a delay
                setTimeout(() => {
                    locateMe();
                }, 300);
            } else if (treatmentText && !locationText) {
                hasSearchedFromURL.current = true;
                setQuery(treatmentText);
                setSelectedService(treatmentText);
                setLoading(true);
                setClinics([]);
                axios
                    .get("/api/clinic/searchByTreatment", { params: { treatment: treatmentText } })
                    .then((res) => {
                        const list = Array.isArray(res.data?.clinics) ? res.data.clinics : [];
                        setClinics(list);
                        setHasSearched(true);
                    })
                    .finally(() => setLoading(false));
            }
        }
    }, [router.isReady, router.query.treatment, router.query.location]);

    // Save search state to localStorage whenever it changes
    useEffect(() => {
        if (clinics.length > 0 && coords) {
            const stateToPersist = {
                clinics,
                coords,
                selectedService,
                manualPlace,
                currentPage,
                ratingFilter,
                timestamp: Date.now(),
            };
            localStorage.setItem(
                "ayurvedaSearchState",
                JSON.stringify(stateToPersist)
            );
        }
    }, [
        clinics,
        coords,
        selectedService,
        manualPlace,
        currentPage,
        ratingFilter,
    ]);

    // Reset currentPage when filters or results change
    useEffect(() => {
        setCurrentPage(1);
    }, [clinics, ratingFilter, priceRange, sortBy, quickFilters]);

    // Clear persisted state when user performs a new search
    const clearPersistedState = () => {
        localStorage.removeItem("ayurvedaSearchState");
    };

    const getFilteredClinics = () => {
        const filtered = clinics.filter((clinic) => {
            const rating = clinicReviews[clinic._id]?.averageRating ?? 0;
            const matchesRating = rating >= ratingFilter;

            // Price filter
            const clinicPrice = parsePriceValue(clinic.pricing);
            const matchesPrice = clinicPrice >= priceRange[0] && clinicPrice <= priceRange[1];

            // Timing filter (simplified since clinics don't have detailed time slots)
            const matchesTiming = selectedTimes.length === 0 || true; // Always true for clinics since they don't have detailed time slots
            const matchesVerified = !quickFilters.verifiedOnly || clinic.verified || clinic.isApproved;
            const matchesPhotos = !quickFilters.hasPhotos || (clinic.photos?.length || 0) > 0;
            const matchesBudget = !quickFilters.budgetFriendly || clinicPrice <= 500;

            return matchesRating && matchesPrice && matchesTiming && matchesVerified && matchesPhotos && matchesBudget;
        });

        return getSortedClinics(filtered);
    };

    const handleAuthSuccess = () => {
        setShowAuthModal(false);

        // Execute the pending action after successful auth
        if (pendingAction) {
            if (pendingAction.type === "enquiry") {
                const params = new URLSearchParams({
                    clinicId: pendingAction.clinic._id,
                    clinicName: pendingAction.clinic.name,
                    clinicAddress: pendingAction.clinic.address,
                });
                router.push(`/clinic/enquiry-form?${params.toString()}`);
            } else if (pendingAction.type === "review") {
                const params = new URLSearchParams({
                    clinicId: pendingAction.clinic._id,
                    clinicName: pendingAction.clinic.name,
                });
                router.push(`/clinic/review-form?${params.toString()}`);
            }
            setPendingAction(null);
        }
    };

    const handleAuthModalClose = () => {
        setShowAuthModal(false);
        setPendingAction(null);
    };

    // Haversine formula to calculate distance between two points
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
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
        const distance = R * c;
        return Math.round(distance * 10) / 10;
    };

    const formatDistance = (distance) => {
        if (distance < 1) {
            return `${Math.round(distance * 1000)}m`;
        }
        return `${distance}km`;
    };

    // Helper function to recalculate distances for existing clinics when user location is available
    const recalculateDistancesForClinics = (userLat, userLng) => {
        if (!userLat || !userLng) return;
        
        setClinics(prevClinics => {
            return prevClinics.map(clinic => {
                if (
                    clinic.location &&
                    clinic.location.coordinates &&
                    clinic.location.coordinates.length === 2
                ) {
                    const clinicLng = clinic.location.coordinates[0];
                    const clinicLat = clinic.location.coordinates[1];
                    const distance = calculateDistance(userLat, userLng, clinicLat, clinicLng);
                    return {
                        ...clinic,
                        distance: distance,
                    };
                }
                return clinic;
            });
        });
    };

    const fetchSuggestions = async (q) => {
        if (!q.trim()) return setSuggestions([]);

        try {
            const treatRes = await axios.get("/api/clinics/search?q=" + encodeURIComponent(q));

            const treatmentSuggestions = (treatRes.data.treatments || []).map(
                (t) => ({
                    type: t.type,
                    value: t.value,
                })
            );

            setSuggestions(treatmentSuggestions);
        } catch (err) {
            // console.error("Error fetching suggestions:", err);
            setSuggestions([]);
        }
    };

    // Add clear search function
    const clearSearch = () => {
        setClinics([]);
        setCoords(null);
        setUserCurrentLocation(null); // Also clear user's current location
        setSelectedService("");
        setManualPlace("");
        setQuery("");
        setCurrentPage(1);
        setRatingFilter(0);
        setSuggestions([]);
        setHasSearched(false);
        setFormErrors({ service: "", location: "" });
        clearPersistedState();
        // Clear session token so that on refresh, previous results won't be loaded
        if (typeof window !== "undefined") {
            sessionStorage.removeItem("ayurvedaSessionToken");
        }
        // Clear URL parameters
        updateURL("", "");
        toast("Search cleared", { icon: "" });
    };

    const validateSearchInputs = () => {
        const errors = { service: "", location: "" };
        let hasBlockingError = false;

        if (!manualPlace.trim()) {
            errors.location = "Please add a location or use Near Me";
            hasBlockingError = true;
        }

        if (!query.trim() && !selectedService) {
            errors.service = "Tip: add a treatment or clinic name for sharper results";
        }

        setFormErrors(errors);

        if (hasBlockingError) {
            toast.error("Add a location before searching");
            return false;
        }
        return true;
    };

    const handleSearch = () => {
        if (!validateSearchInputs()) return;
        // Reset URL search flag so manual searches work
        hasSearchedFromURL.current = false;
       
        // ALWAYS get values directly from input fields
        const treatmentValue = query.trim();
        const locationValue = manualPlace.trim();
       
        // If query has value but selectedService doesn't, set selectedService to query
        const serviceToUse = treatmentValue && !selectedService ? treatmentValue : selectedService;
        if (treatmentValue && !selectedService) {
            setSelectedService(treatmentValue);
        }
       
        // Make sure we have a valid location
        if (!locationValue) {
            toast.error("Please enter a valid location");
            return;
        }
       
        // Update URL immediately with values from input fields
        updateURL(serviceToUse || treatmentValue, locationValue, selectedTreatmentSlug);
       
        // Then proceed with search
        searchByPlace(serviceToUse);
    };

    const toggleQuickFilter = (filterKey) => {
        setQuickFilters((prev) => {
            const updated = { ...prev, [filterKey]: !prev[filterKey] };
            toast.success(
                `${updated[filterKey] ? "Applied" : "Removed"} ${quickFilterMeta[filterKey].label}`
            );
            return updated;
        });
    };

    const activeFilters = useMemo(() => {
        const filters = [];
        if (ratingFilter > 0) {
            filters.push(`${ratingFilter}★ & up`);
        }
        if (priceRange[0] > 0 || priceRange[1] < 10000) {
            filters.push(
                `₹${priceRange[0].toLocaleString()} - ₹${priceRange[1].toLocaleString()}`
            );
        }
        if (selectedTimes.length > 0) {
            filters.push(`${selectedTimes.length} availability`);
        }
        Object.entries(quickFilters).forEach(([key, value]) => {
            if (value) {
                filters.push(quickFilterMeta[key].label);
            }
        });
        return filters;
    }, [priceRange, ratingFilter, selectedTimes, quickFilters]);

    const fetchClinics = async (lat, lng, serviceOverride = null) => {
        console.log("=== FETCH CLINICS CALLED ===");
        console.log("Location:", { lat, lng });
        console.log("Service override:", serviceOverride);
        console.log("Selected service:", selectedService);
        console.log("Query:", query);
        
        setLoading(true);
        if (loadingToastId.current) {
            toast.dismiss(loadingToastId.current);
        }
        loadingToastId.current = toast.loading("Searching for clinics near you...");
        try {
            // Use serviceOverride if provided, otherwise use selectedService, otherwise use query
            const serviceToSearch = serviceOverride || selectedService || query.trim();
            console.log("Service to search:", serviceToSearch || "(none)");
            
            const res = await axios.get("/api/clinics/nearby", {
                params: { lat, lng, service: serviceToSearch },
            });
            
            console.log("API Response:", {
                success: res.data.success,
                clinicsCount: res.data.clinics?.length || 0,
                hasClinics: !!res.data.clinics && Array.isArray(res.data.clinics) && res.data.clinics.length > 0
            });
           
            // Check if clinics array exists and is not empty
            if (!res.data || !res.data.clinics || !Array.isArray(res.data.clinics) || res.data.clinics.length === 0) {
                console.log("❌ NO CLINICS IN RESPONSE!");
                console.log("Response data:", res.data);
                setClinics([]);
                setHasSearched(true);
                toast("No clinics found for this search", { icon: "🔍" });
                return;
            }
            
            console.log("✅ Found", res.data.clinics.length, "clinics in response");
           
            // Use user's current location for distance calculation if available, otherwise use searched location
            const distanceLat = userCurrentLocation?.lat || lat;
            const distanceLng = userCurrentLocation?.lng || lng;
            
            const clinicsWithDistance = res.data.clinics.map((clinic) => {
                // Normalize photos array if it exists
                const normalizedPhotos = clinic.photos?.map(photo => normalizeImagePath(photo)) || clinic.photos;
               
                if (
                    clinic.location &&
                    clinic.location.coordinates &&
                    clinic.location.coordinates.length === 2
                ) {
                    const clinicLng = clinic.location.coordinates[0];
                    const clinicLat = clinic.location.coordinates[1];
                    // Calculate distance from user's current location (or searched location if current location not available)
                    const distance = calculateDistance(distanceLat, distanceLng, clinicLat, clinicLng);
                    return {
                        ...clinic,
                        photos: normalizedPhotos,
                        distance: distance,
                    };
                } else {
                    return {
                        ...clinic,
                        photos: normalizedPhotos,
                        distance: null
                    };
                }
            });
            // Sort by distance, but keep Dubai prioritized clinics at top
            clinicsWithDistance.sort((a, b) => {
                // If both have Dubai priority, sort by distance
                if (a.isDubaiPrioritized && b.isDubaiPrioritized) {
                    if (a.distance === null) return 1;
                    if (b.distance === null) return -1;
                    return (a.distance ?? 0) - (b.distance ?? 0);
                }
                // Dubai prioritized clinics always come first
                if (a.isDubaiPrioritized) return -1;
                if (b.isDubaiPrioritized) return 1;
                // Regular distance sorting
                if (a.distance === null) return 1;
                if (b.distance === null) return -1;
                return (a.distance ?? 0) - (b.distance ?? 0);
            });
            setClinics(clinicsWithDistance);
            setHasSearched(true);

            // Auto-adjust price range slider based on clinic prices
            if (clinicsWithDistance.length > 0) {
                const prices = clinicsWithDistance
                    .map(c => parsePriceValue(c.pricing))
                    .filter(p => p > 0);
               
                if (prices.length > 0) {
                    const maxPrice = Math.max(...prices);
                    const minPrice = Math.min(...prices);
                   
                    // Set max to at least the highest clinic price, rounded up to nearest 1000
                    const newMax = Math.max(40000, Math.ceil(maxPrice / 1000) * 1000);
                   
                    // Only update if current max is too low
                    if (priceRange[1] < maxPrice) {
                        setPriceRange([priceRange[0], newMax]);
                    }
                }
            }

            // Scroll to results section when clinics are loaded
            setTimeout(() => {
                if (resultsRef.current && clinicsWithDistance.length > 0) {
                    resultsRef.current.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }, 100);

            if (clinicsWithDistance.length === 0) {
                toast("No clinics found for this search", { icon: "🔍" });
            } else {
                toast.success(`Found ${clinicsWithDistance.length} clinics`);
            }
        } catch (error) {
            console.error("Error fetching clinics:", error);
            toast.error("Unable to fetch clinics right now. Please try again.");
            setClinics([]);
            setHasSearched(true);
        } finally {
            if (loadingToastId.current) {
                toast.dismiss(loadingToastId.current);
                loadingToastId.current = null;
            }
            setLoading(false);
        }
    };

    const locateMe = () => {
        // Reset URL search flag so manual searches work
        hasSearchedFromURL.current = false;
       
        setLoading(true);
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
        updateURL(serviceToUse || treatmentValue, locationForURL, selectedTreatmentSlug);
       
        // Request location permission from browser (will show browser's native permission dialog)
        const locatingToast = toast.loading("Getting your location...");
        
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setCoords({ lat: latitude, lng: longitude });
                setUserCurrentLocation({ lat: latitude, lng: longitude }); // Store user's current location
                setHasSearched(true);
               
                // If clinics are already loaded, recalculate distances with user's current location
                if (clinics.length > 0) {
                    recalculateDistancesForClinics(latitude, longitude);
                }
               
                fetchClinics(latitude, longitude);
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

    const searchByPlace = async (serviceOverride = null) => {
        // ALWAYS get location value directly from input field
        const placeQuery = manualPlace.trim();
        if (!placeQuery) {
            setFormErrors((prev) => ({ ...prev, location: "Please add a location" }));
            toast.error("Add a location before searching");
            return;
        }

        setLoading(true);
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
       
        const geocodeToastId = toast.loading("Validating location...");
        try {
            const res = await axios.get("/api/clinics/geocode", {
                params: { place: placeQuery },
            });

            setCoords({ lat: res.data.lat, lng: res.data.lng });
            setFormErrors((prev) => ({ ...prev, location: "" }));
            toast.success(`Location pinned: ${placeQuery}`);
            setHasSearched(true);
           
            // Get values from input fields for URL update
            const treatmentValue = query.trim();
            const serviceToUse = serviceOverride || selectedService || treatmentValue;
           
            // Update URL with values from input fields - always use actual input values
            updateURL(serviceToUse || treatmentValue, placeQuery, selectedTreatmentSlug);
           
            fetchClinics(res.data.lat, res.data.lng, serviceOverride);
        } catch {
            toast.error("We couldn't find that place. Try a nearby landmark.");
            setLoading(false);
        } finally {
            toast.dismiss(geocodeToastId);
        }
    };

    // Separate function for URL-based searches (to avoid infinite loops)
    const searchByPlaceFromURL = async (locationText, serviceText = null) => {
        if (!locationText) return;

        setLoading(true);
        clearPersistedState();
        const geocodeToastId = toast.loading("Validating location...");
        try {
            const res = await axios.get("/api/clinics/geocode", {
                params: { place: locationText },
            });

            setCoords({ lat: res.data.lat, lng: res.data.lng });
            setFormErrors((prev) => ({ ...prev, location: "" }));
            setHasSearched(true);
           
            // Use the service from URL if provided
            const serviceToUse = serviceText || selectedService || query.trim();
            fetchClinics(res.data.lat, res.data.lng, serviceText);
        } catch {
            toast.error("We couldn't find that place. Try a nearby landmark.");
            setLoading(false);
        } finally {
            toast.dismiss(geocodeToastId);
        }
    };

    const renderStars = (rating = 4.0) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push(
                <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
            );
        }

        if (hasHalfStar) {
            stars.push(
                <Star
                    key="half"
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-400/50 text-yellow-400"
                />
            );
        }

        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<Star key={`empty-${i}`} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#cbd5e1]" />);
        }

        return stars;
    };

    // Function to fetch reviews for a single clinic
    const fetchReviewsForClinic = async (clinicId) => {
        try {
            const res = await axios.get(`/api/clinics/reviews/${clinicId}`);
            if (res.data.success) {
                setClinicReviews((prev) => ({
                    ...prev,
                    [clinicId]: res.data.data,
                }));
            }
        } catch {
            setClinicReviews((prev) => ({
                ...prev,
                [clinicId]: {
                    averageRating: 0,
                    totalReviews: 0,
                    reviews: [],
                },
            }));
        }
    };

    useEffect(() => {
        if (!clinics || clinics.length === 0) return;
        const fetchReviews = async () => {
            // Set loading state for all clinics
            const loadingState = {};
            clinics.forEach((clinic) => {
                loadingState[clinic._id] = true;
            });

            const reviewsObj = {};
            await Promise.all(
                clinics.map(async (clinic) => {
                    try {
                        const res = await axios.get(`/api/clinics/reviews/${clinic._id}`);
                        if (res.data.success) {
                            reviewsObj[clinic._id] = res.data.data;
                        }
                    } catch {
                        reviewsObj[clinic._id] = {
                            averageRating: 0,
                            totalReviews: 0,
                            reviews: [],
                        };
                    }
                })
            );
            setClinicReviews(reviewsObj);

            // Clear loading state for all clinics
            const clearLoadingState = {};
            clinics.forEach((clinic) => {
                clearLoadingState[clinic._id] = false;
            });
        };
        fetchReviews();
    }, [clinics]);

    const filteredClinics = getFilteredClinics();
    const pageSize = 6;
    const totalPages = Math.ceil(filteredClinics.length / pageSize);
    const paginatedClinics = filteredClinics.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const hasResults = clinics.length > 0;

    return (
        <>
            <Head>
                <title>ZEVA Healthcare Directory - Find Trusted Clinics & Medical Professionals You Can Rely On </title>
                <meta name="description" content="Discover verified Ayurveda clinics with transparent pricing, authentic treatments, and patient reviews. Search by location, treatment type, or clinic name to find the best healthcare providers near you." />
                <meta name="keywords" content="Ayurveda clinics, healthcare directory, medical professionals, Ayurveda treatments, Panchakarma, verified clinics, healthcare search, medical directory, ZEVA healthcare" />
                <meta property="og:title" content="ZEVA Healthcare Directory - Find Trusted Ayurveda Clinics" />
                <meta property="og:description" content="Your trusted platform for authentic Ayurveda healthcare. Find verified clinics with transparent pricing and patient reviews." />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="ZEVA Healthcare Directory" />
                <meta name="twitter:description" content="Find trusted Ayurveda clinics and medical professionals with transparent pricing and verified reviews." />
                <link rel="canonical" href="https://zevahealthcare.com/clinic/findclinic" />
                {/* Schema Markup - Search Health Center WebPage */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "MedicalWebPage",
                            "name": "Search Health Center",
                            "url": "https://zeva360.com/clinic/findclinic",
                            "description": "Find verified healthcare centers and clinics near you with ZEVA. Search by location, specialty, or clinic name to access authentic treatments, transparent pricing, and patient reviews.",
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
                                "name": "Healthcare Centers & Clinics",
                                "description": "Trusted medical centers and clinics providing verified healthcare services across multiple specialties."
                            },
                            "mainEntity": {
                                "@type": "Website",
                                "name": "Search Health Center",
                                "url": "https://zeva360.com/search-health-center",
                                "potentialAction": {
                                    "@type": "SearchAction",
                                    "target": "https://zeva360.com/search-health-center?query={search_term_string}",
                                    "query-input": "required name=search_term_string"
                                }
                            }
                        })
                    }}
                />
            </Head>
            <div className="min-h-screen bg-[#f8fafc]">
                {/* Auth Modal */}
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
           
            {/* Professional Header Section */}
            <div className="w-full bg-gradient-to-br from-white via-[#f8fafc] to-[#f0f7ff] border-b border-[#e2e8f0] shadow-sm sticky top-0 z-60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                    {/* Professional Header */}
                    <div className="text-center mb-6">
                        <div className="flex items-center justify-center mb-3">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center mr-3 bg-gradient-to-br from-[#0284c7] via-[#0ea5e9] to-[#06b6d4] shadow-lg">
                                <HeartPulse className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left">
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl mt-7 font-bold text-[#1e293b] tracking-tight">
                                    ZEVA Healthcare Directory
                                </h1>
                                <p className="text-xs sm:text-sm text-[#64748b] mt-0.5">
                                Trusted Clinics & Medical Professionals You Can Rely On
                                </p>


                            </div>
                        </div>
                        <p className="text-sm sm:text-base text-[#475569] max-w-2xl mx-auto mt-3">
                        ZEVA Healthcare Directory helps you quickly find verified clinics and trusted medical professionals, offering transparent details and real patient reviews to choose care with confidence.
                        </p>
                    </div>

                    {/* Professional Search Interface */}
                    <div className="w-full max-w-6xl mx-auto" style={{ position: 'relative', zIndex: 100 }}>
                        {/* Quick Filter Chips - Dynamic Specialties */}
                        {specialtiesLoading ? (
                            <div className="mb-3 flex flex-wrap gap-2">
                                <div className="px-3 py-1.5 text-[10px] text-gray-500">Loading specialties...</div>
                            </div>
                        ) : specialties.length > 0 ? (
                            <div className="mb-3 flex flex-wrap gap-2">
                                {specialties.map((specialty) => (
                                    <button
                                        key={specialty}
                                        onClick={async () => {
                                            // If clicking the same specialty again, don't change location
                                            const isSameSpecialty = selectedService === specialty;
                                            
                                            // If clicking a different specialty, clear previous selection
                                            if (!isSameSpecialty && selectedService) {
                                                setClinics([]);
                                                setManualPlace("");
                                                clearPersistedState();
                                            }
                                            
                                            setQuery(specialty);
                                            setSelectedService(specialty);
                                            
                                            // Automatically search for clinics with this specialty from Clinic model
                                            try {
                                                setLoading(true);
                                                
                                                // Only clear results if selecting a different specialty
                                                if (!isSameSpecialty) {
                                                    setClinics([]);
                                                    clearPersistedState();
                                                }
                                                
                                                // Search clinics by treatment directly from Clinic (no location required)
                                                const res = await axios.get("/api/clinic/searchByTreatment", {
                                                    params: { treatment: specialty },
                                                });

                                                if (res.data.success && res.data.clinics) {
                                                    // Calculate distances if user location is available
                                                    const clinicsWithDistance = res.data.clinics.map((clinic) => {
                                                        if (clinic.location?.coordinates?.length === 2 && userCurrentLocation) {
                                                            const clinicLng = clinic.location.coordinates[0];
                                                            const clinicLat = clinic.location.coordinates[1];
                                                            const distance = calculateDistance(
                                                                userCurrentLocation.lat,
                                                                userCurrentLocation.lng,
                                                                clinicLat,
                                                                clinicLng
                                                            );
                                                            return { ...clinic, distance };
                                                        }
                                                        return { ...clinic, distance: null };
                                                    });

                                                    // Sort by distance if available, otherwise keep original order
                                                    clinicsWithDistance.sort((a, b) => {
                                                        if (a.distance === null && b.distance === null) return 0;
                                                        if (a.distance === null) return 1;
                                                        if (b.distance === null) return -1;
                                                        return (a.distance || 0) - (b.distance || 0);
                                                    });

                                                    setClinics(clinicsWithDistance);
                                                    setHasSearched(true);

                                                    // Do not auto-fill or clear location based on results

                                                    // Update URL using only manualPlace if provided
                                                    updateURL(specialty, manualPlace.trim());
                                                } else {
                                                    // No clinics found
                                                    setClinics([]);
                                                    setHasSearched(true);
                                                    updateURL(specialty, 'all-clinics');
                                                }
                                            } catch (error) {
                                                console.error("Error searching clinics:", error);
                                                setClinics([]);
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        className={`px-3 py-1.5 text-[10px] font-medium rounded-full border transition-all shadow-sm hover:shadow ${
                                            selectedService === specialty
                                                ? 'bg-gradient-to-r from-blue-100 to-purple-100 border-blue-400 text-blue-800'
                                                : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-purple-100 hover:border-blue-300'
                                        }`}
                                    >
                                        {specialty}
                                    </button>
                                ))}
                            </div>
                        ) : null}
                        <div className={`rounded-2xl p-4 sm:p-5 shadow-lg border border-[#e2e8f0] bg-white backdrop-blur-sm ${hasResults ? "mb-3" : "mb-6"}`}>
                            {/* Desktop Layout */}
                            <div className="hidden md:flex gap-3 items-center">
                                {/* Search Input */}
                                <div className="relative flex-1 max-w-lg">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                        <Search className="h-5 w-5 text-[#0284c7]" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search treatments, specialists"
                                        value={query}
                                        onChange={(e) => {
                                            setQuery(e.target.value);
                                            fetchSuggestions(e.target.value);
                                            if (e.target.value === "") {
                                                setSelectedService("");
                                            }
                                            if (formErrors.service) {
                                                setFormErrors((prev) => ({ ...prev, service: "" }));
                                            }
                                        }}
                                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                        className="w-full pl-11 pr-4 py-3 text-[#1e293b] rounded-xl focus:ring-2 focus:ring-[#0284c7] focus:border-[#0284c7] transition-all placeholder:text-[#94a3b8] text-sm border-2 border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                                        aria-invalid={Boolean(formErrors.service)}
                                        ref={searchInputRef}
                                    />

                                    {/* Suggestions Dropdown */}
                                    {suggestions.length > 0 && (
                                        <div
                                            className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg shadow-lg max-h-64 overflow-y-auto border border-[#e2e8f0] bg-white custom-scrollbar"
                                            ref={suggestionsDropdownRef}
                                        >
                                            <div className="p-1">
                                                {suggestions.map((s, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center px-2 py-1.5 hover:bg-[#f0f7ff] cursor-pointer transition-colors border-b border-[#f1f5f9] last:border-b-0 rounded group"
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
                                                            
                                                            // Search clinics by treatment directly from Clinic (no location required)
                                                            try {
                                                                setLoading(true);
                                                                setClinics([]);
                                                                
                                                                const res = await axios.get("/api/clinic/searchByTreatment", {
                                                                    params: { treatment: treatmentValue },
                                                                });

                                                                if (res.data.success && res.data.clinics) {
                                                                    // Calculate distances if user location is available
                                                                    const clinicsWithDistance = res.data.clinics.map((clinic) => {
                                                                        if (clinic.location?.coordinates?.length === 2 && userCurrentLocation) {
                                                                            const clinicLng = clinic.location.coordinates[0];
                                                                            const clinicLat = clinic.location.coordinates[1];
                                                                            const distance = calculateDistance(
                                                                                userCurrentLocation.lat,
                                                                                userCurrentLocation.lng,
                                                                                clinicLat,
                                                                                clinicLng
                                                                            );
                                                                            return { ...clinic, distance };
                                                                        }
                                                                        return { ...clinic, distance: null };
                                                                    });

                                                                    // Sort by distance if available
                                                                    clinicsWithDistance.sort((a, b) => {
                                                                        if (a.distance === null && b.distance === null) return 0;
                                                                        if (a.distance === null) return 1;
                                                                        if (b.distance === null) return -1;
                                                                        return (a.distance || 0) - (b.distance || 0);
                                                                    });

                                                                    setClinics(clinicsWithDistance);
                                                                    setHasSearched(true);

                                                                    // Do not auto-fill or clear location based on results

                                                                    // Update URL using only manualPlace if provided
                                                                    updateURL(treatmentValue, manualPlace.trim());
                                                                } else {
                                                                    setClinics([]);
                                                                    setHasSearched(true);
                                                                    updateURL(treatmentValue, 'all-clinics');
                                                                }
                                                            } catch (error) {
                                                                console.error("Error searching clinics:", error);
                                                                setClinics([]);
                                                            } finally {
                                                                setLoading(false);
                                                            }
                                                        }}
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                        }}
                                                    >
                                                        <div className="flex-shrink-0 w-6 h-6 rounded bg-[#f0f7ff] flex items-center justify-center mr-2">
                                                            {s.type === "specialty" && s.value.toLowerCase().includes("ayurveda") ? (
                                                                <span className="text-xs">🌿</span>
                                                            ) : s.type === "specialty" ? (
                                                                <span className="text-xs">🏥</span>
                                                            ) : (
                                                                <span className="text-xs">⚕️</span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-medium text-[#1e293b] group-hover:text-[#0284c7] transition-colors text-xs">
                                                                {s.value}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {formErrors.service && (
                                        <p className="mt-1 text-xs text-[#0284c7]">
                                            {formErrors.service}
                                        </p>
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
                                        onChange={(e) => {
                                            setManualPlace(e.target.value);
                                            if (formErrors.location) {
                                                setFormErrors((prev) => ({ ...prev, location: "" }));
                                            }
                                        }}
                                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                        className="w-full pl-11 pr-4 py-3 text-[#1e293b] rounded-xl focus:ring-2 focus:ring-[#0284c7] focus:border-[#0284c7] transition-all placeholder:text-[#94a3b8] text-sm border-2 border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                                        aria-invalid={Boolean(formErrors.location)}
                                    />
                                    {formErrors.location && (
                                        <p className="mt-1 text-xs text-[#dc2626]">
                                            {formErrors.location}
                                        </p>
                                    )}
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
                                    <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                            <Search className="h-5 w-5 text-[#0284c7]" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search treatments or clinics..."
                                            value={query}
                                            onChange={(e) => {
                                                setQuery(e.target.value);
                                                fetchSuggestions(e.target.value);
                                                if (e.target.value === "") {
                                                    setSelectedService("");
                                                }
                                                if (formErrors.service) {
                                                    setFormErrors((prev) => ({ ...prev, service: "" }));
                                                }
                                            }}
                                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                            className="w-full pl-11 pr-3 py-3 text-[#1e293b] rounded-xl focus:ring-2 focus:ring-[#0284c7] focus:border-[#0284c7] transition-all placeholder:text-[#94a3b8] text-sm border-2 border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                                            aria-invalid={Boolean(formErrors.service)}
                                            ref={searchInputRef}
                                        />

                                        {/* Mobile Suggestions */}
                                        {suggestions.length > 0 && (
                                            <div
                                                className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg shadow-lg max-h-64 overflow-y-auto border border-[#e2e8f0] bg-white custom-scrollbar"
                                                ref={suggestionsDropdownRef}
                                            >
                                                <div className="p-1">
                                                    {suggestions.map((s, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex items-center px-2 py-1.5 hover:bg-[#f0f7ff] cursor-pointer transition-colors border-b border-[#f1f5f9] last:border-b-0 rounded group"
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
                                                                
                                                                // Search clinics by treatment directly from Clinic (no location required)
                                                                try {
                                                                    setLoading(true);
                                                                    setClinics([]);
                                                                    
                                                                    const res = await axios.get("/api/clinic/searchByTreatment", {
                                                                        params: { treatment: treatmentValue },
                                                                    });

                                                                    if (res.data.success && res.data.clinics) {
                                                                        // Calculate distances if user location is available
                                                                        const clinicsWithDistance = res.data.clinics.map((clinic) => {
                                                                            if (clinic.location?.coordinates?.length === 2 && userCurrentLocation) {
                                                                                const clinicLng = clinic.location.coordinates[0];
                                                                                const clinicLat = clinic.location.coordinates[1];
                                                                                const distance = calculateDistance(
                                                                                    userCurrentLocation.lat,
                                                                                    userCurrentLocation.lng,
                                                                                    clinicLat,
                                                                                    clinicLng
                                                                                );
                                                                                return { ...clinic, distance };
                                                                            }
                                                                            return { ...clinic, distance: null };
                                                                        });

                                                                        // Sort by distance if available
                                                                        clinicsWithDistance.sort((a, b) => {
                                                                            if (a.distance === null && b.distance === null) return 0;
                                                                            if (a.distance === null) return 1;
                                                                            if (b.distance === null) return -1;
                                                                            return (a.distance || 0) - (b.distance || 0);
                                                                        });

                                                                        setClinics(clinicsWithDistance);
                                                                        setHasSearched(true);

                                                                        // Auto-fill location field ONLY if exactly 1 clinic found
                                                                        // If more than 1 clinic, don't auto-fill location
                                                                        if (clinicsWithDistance.length === 1 && !manualPlace.trim()) {
                                                                            const clinicWithAddress = clinicsWithDistance.find(
                                                                                (clinic) => clinic.address && clinic.address.trim()
                                                                            );
                                                                            if (clinicWithAddress?.address) {
                                                                                setManualPlace(clinicWithAddress.address.trim());
                                                                            }
                                                                        } else if (clinicsWithDistance.length > 1) {
                                                                            // More than 1 clinic - clear location field
                                                                            setManualPlace("");
                                                                        }

                                                                        // Update URL with location from clinic's address or current manualPlace
                                                                        const locationForURL = manualPlace.trim() || 
                                                                            (clinicsWithDistance.length > 0 && clinicsWithDistance[0]?.address 
                                                                                ? clinicsWithDistance[0].address.trim() 
                                                                                : 'all-clinics');
                                                                        updateURL(treatmentValue, locationForURL);
                                                                    } else {
                                                                        setClinics([]);
                                                                        setHasSearched(true);
                                                                        updateURL(treatmentValue, 'all-clinics');
                                                                    }
                                                                } catch (error) {
                                                                    console.error("Error searching clinics:", error);
                                                                    setClinics([]);
                                                                } finally {
                                                                    setLoading(false);
                                                                }
                                                            }}
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                            }}
                                                        >
                                                            <div className="flex-shrink-0 w-6 h-6 rounded bg-[#f0f7ff] flex items-center justify-center mr-2">
                                                                {s.type === "specialty" && s.value.toLowerCase().includes("ayurveda") ? (
                                                                    <span className="text-xs">🌿</span>
                                                                ) : s.type === "specialty" ? (
                                                                    <span className="text-xs">🏥</span>
                                                                ) : s.type === "treatment" ? (
                                                                    <span className="text-xs">⚕️</span>
                                                                ) : (
                                                                    <span className="text-xs">🩺</span>
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="font-medium text-[#1e293b] group-hover:text-[#0284c7] transition-colors text-xs">
                                                                    {s.value}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {formErrors.service && (
                                            <p className="mt-1 text-xs text-[#0284c7]">
                                                {formErrors.service}
                                            </p>
                                        )}
                                    </div>

                                    {/* Near Me Button for Mobile */}
                                    <button
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
                                        onChange={(e) => {
                                            setManualPlace(e.target.value);
                                            if (formErrors.location) {
                                                setFormErrors((prev) => ({ ...prev, location: "" }));
                                            }
                                        }}
                                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                        className="w-full pl-11 pr-3 py-3 text-[#1e293b] rounded-xl focus:ring-2 focus:ring-[#0284c7] focus:border-[#0284c7] transition-all placeholder:text-[#94a3b8] text-sm border-2 border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                                        aria-invalid={Boolean(formErrors.location)}
                                    />
                                    {formErrors.location && (
                                        <p className="mt-1 text-xs text-[#dc2626]">
                                            {formErrors.location}
                                        </p>
                                    )}
                                </div>

                                {/* Mobile Search Button */}
                                <button
                                    onClick={handleSearch}
                                    className="w-full px-6 py-3 text-white rounded-xl font-semibold bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] hover:from-[#0369a1] hover:to-[#0284c7] shadow-md hover:shadow-lg transition-all text-sm"
                                >
                                    Search Clinics
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            <div
                ref={resultsRef}
                className={`w-full bg-gradient-to-b from-[#f8fafc] to-white ${hasResults ? "pt-4 pb-6" : "pt-8 pb-12"}`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                {clinics.length > 0 ? (
                    <div className="flex flex-col lg:flex-row gap-3">
                        {/* Filters Sidebar */}
                        <div className="lg:w-1/4">
                            <div className="bg-white rounded-xl shadow-md border-2 border-[#e2e8f0] p-4 sticky top-32 z-40">
                                {/* Price Range Filter */}
                                <div className="mb-4">
                                    <h3 className="text-sm font-bold text-[#1e293b] mb-3 flex items-center">
                                        <BadgeIndianRupee className="w-4 h-4 mr-1.5 text-[#0284c7]" />
                                        Price Range
                                    </h3>
                                    <div className="px-1">
                                        {/* Price Display */}
                                        <div className="flex justify-between items-center mb-2 p-2 bg-[#f8fafc] rounded border border-[#e2e8f0]">
                                            <div className="text-center">
                                                <p className="text-xs text-[#64748b] mb-0.5">Min</p>
                                                <p className="text-sm font-bold text-[#0284c7]">₹{priceRange[0].toLocaleString()}</p>
                                            </div>
                                            <div className="w-px h-6 bg-[#cbd5e1]"></div>
                                            <div className="text-center">
                                                <p className="text-xs text-[#64748b] mb-0.5">Max</p>
                                                <p className="text-sm font-bold text-[#0284c7]">₹{priceRange[1].toLocaleString()}</p>
                                            </div>
                                        </div>

                                        {/* Separate Range Sliders */}
                                        <div className="space-y-2">
                                            {/* Min Price Slider */}
                                            <div>
                                                <label className="block text-xs font-medium text-[#475569] mb-1">
                                                    Min: ₹{priceRange[0].toLocaleString()}
                                                </label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={Math.max(10000, Math.ceil(priceRange[1] / 1000) * 1000)}
                                                    value={priceRange[0]}
                                                    onChange={(e) => {
                                                        const newMin = parseInt(e.target.value);
                                                        if (newMin < priceRange[1]) {
                                                            setPriceRange([newMin, priceRange[1]]);
                                                        }
                                                    }}
                                                    className="w-full h-1 bg-[#e2e8f0] rounded appearance-none cursor-pointer"
                                                    style={{
                                                        background: `linear-gradient(to right, #0284c7 0%, #0284c7 ${(priceRange[0] / Math.max(10000, Math.ceil(priceRange[1] / 1000) * 1000)) * 100}%, #e2e8f0 ${(priceRange[0] / Math.max(10000, Math.ceil(priceRange[1] / 1000) * 1000)) * 100}%, #e2e8f0 100%)`
                                                    }}
                                                />
                                            </div>

                                            {/* Max Price Slider */}
                                            <div>
                                                <label className="block text-xs font-medium text-[#475569] mb-1">
                                                    Max: ₹{priceRange[1].toLocaleString()}
                                                </label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={Math.max(10000, Math.ceil(priceRange[1] / 1000) * 1000)}
                                                    value={priceRange[1]}
                                                    onChange={(e) => {
                                                        const newMax = parseInt(e.target.value);
                                                        if (newMax > priceRange[0]) {
                                                            setPriceRange([priceRange[0], newMax]);
                                                        }
                                                    }}
                                                    className="w-full h-1 bg-[#e2e8f0] rounded appearance-none cursor-pointer"
                                                    style={{
                                                        background: `linear-gradient(to right, #0284c7 0%, #0284c7 ${(priceRange[1] / Math.max(10000, Math.ceil(priceRange[1] / 1000) * 1000)) * 100}%, #e2e8f0 ${(priceRange[1] / Math.max(10000, Math.ceil(priceRange[1] / 1000) * 1000)) * 100}%, #e2e8f0 100%)`
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Price Labels */}
                                        <div className="flex justify-between text-xs text-[#64748b] mt-1">
                                            <span>₹0</span>
                                            <span>₹{Math.max(10000, Math.ceil(priceRange[1] / 1000) * 1000).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Sort By Filter */}
                                <div className="mb-4">
                                    <h3 className="text-sm font-bold text-[#1e293b] mb-3 flex items-center">
                                        <Clock className="w-4 h-4 mr-1.5 text-[#0284c7]" />
                                        Sort By
                                    </h3>
                                    <div className="space-y-2">
                                        {[
                                            { value: 'relevance', label: 'Relevance' },
                                            { value: 'price-low-high', label: 'Price: Low to High' },
                                            { value: 'price-high-low', label: 'Price: High to Low' },
                                            { value: 'rating-high-low', label: 'Highest Rated' }
                                        ].map((option) => (
                                            <label key={option.value} className="flex items-center cursor-pointer hover:bg-[#f8fafc] p-1.5 rounded transition-colors">
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

                                {/* Star Rating Filter */}
                                <div className="mb-4">
                                    <h3 className="text-sm font-bold text-[#1e293b] mb-3 flex items-center">
                                        <Star className="w-4 h-4 mr-1.5 text-[#0284c7]" />
                                        Minimum Rating
                                    </h3>
                                    <div className="space-y-2">
                                        {[5, 4, 3].map((rating) => (
                                            <label key={rating} className="flex items-center cursor-pointer hover:bg-[#f8fafc] p-1.5 rounded transition-colors">
                                                <input
                                                    type="radio"
                                                    name="rating"
                                                    value={rating}
                                                    checked={ratingFilter === rating}
                                                    onChange={(e) => setRatingFilter(parseInt(e.target.value))}
                                                    className="w-4 h-4 text-[#0284c7] bg-white border-[#cbd5e1] focus:ring-[#0284c7] focus:ring-2"
                                                />
                                                <div className="ml-2 flex items-center">
                                                    <div className="flex">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={`w-3.5 h-3.5 ${i < rating ? 'text-yellow-400 fill-current' : 'text-[#cbd5e1]'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="ml-2 text-xs text-[#475569] font-medium">& above</span>
                                                </div>
                                            </label>
                                        ))}
                                        <label className="flex items-center cursor-pointer hover:bg-[#f8fafc] p-1.5 rounded transition-colors">
                                            <input
                                                type="radio"
                                                name="rating"
                                                value={0}
                                                checked={ratingFilter === 0}
                                                onChange={(e) => setRatingFilter(parseInt(e.target.value))}
                                                className="w-4 h-4 text-[#0284c7] bg-white border-[#cbd5e1] focus:ring-[#0284c7] focus:ring-2"
                                            />
                                            <span className="ml-2 text-xs text-[#475569] font-medium">All Ratings</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Clear Filters Button */}
                                <div className="pt-3 border-t border-[#e2e8f0]">
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="w-full px-4 py-2 bg-[#dc2626] text-white rounded-lg hover:bg-[#b91c1c] transition-all text-xs font-semibold shadow-sm hover:shadow"
                                    >
                                        Clear All Filters
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Clinics List */}
                        <div className="lg:w-3/4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-[#1e293b] mb-1">
                                        {filteredClinics.length} {filteredClinics.length === 1 ? 'Clinic' : 'Clinics'} Found
                                    </h2>
                                    {selectedService && (
                                        <p className="text-sm text-[#64748b] flex items-center">
                                            <span className="w-1.5 h-1.5 bg-[#0284c7] rounded-full mr-1.5"></span>
                                            Showing results for &quot;<span className="font-medium text-[#0284c7]">{selectedService}</span>&quot;
                                        </p>
                                    )}
                                </div>

                                {clinics.length > 0 && (
                                    <button
                                        onClick={clearSearch}
                                        className="px-4 py-2 rounded-lg border-2 border-[#e2e8f0] text-[#475569] hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-all text-sm font-medium flex items-center shadow-sm"
                                    >
                                        <X className="w-4 h-4 mr-1.5" />
                                        Clear Search
                                    </button>
                                )}
                            </div>


                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#e2e8f0] border-t-[#0284c7]"></div>
                                    <span className="ml-3 text-[#475569] text-xs">Searching...</span>
                                </div>
                            ) : filteredClinics.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 sm:p-8">
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 rounded-full bg-[#f0f7ff] flex items-center justify-center mx-auto mb-3">
                                            <Search className="w-8 h-8 text-[#0284c7]" />
                                        </div>
                                        <h3 className="text-lg sm:text-xl font-bold text-[#1e293b] mb-2">
                                            No Results Found
                                        </h3>
                                        <p className="text-sm text-[#64748b] mb-1">
                                            Try adjusting your search criteria or filters
                                        </p>
                                    </div>
                                   
                                    {/* Professional ZEVA Clinics Information Section */}
                                    <div className="bg-gradient-to-br from-[#f0f7ff] via-[#e0f2fe] to-[#bae6fd] rounded-xl p-6 sm:p-8 border border-[#cbd5e1] shadow-sm">
                                        <div className="flex items-center mb-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0284c7] to-[#0ea5e9] flex items-center justify-center mr-3 shadow-md">
                                                <HeartPulse className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b]">
                                                    ZEVA Healthcare Trust
                                                </h2>
                                                <p className="text-xs sm:text-sm text-[#64748b] mt-0.5">
                                                    Your Trusted Ayurveda Healthcare Platform
                                                </p>
                                            </div>
                                        </div>
                                       
                                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                                            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                                                <div className="flex items-start mb-2">
                                                    <Shield className="w-5 h-5 text-[#0284c7] mr-2 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <h3 className="text-sm font-bold text-[#1e293b] mb-1">Verified Clinics</h3>
                                                        <p className="text-xs text-[#475569] leading-relaxed">
                                                            All listed clinics are verified and authenticated Ayurveda practitioners with proper certifications and credentials
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
                                                        <h3 className="text-sm font-bold text-[#1e293b] mb-1">Transparent Pricing</h3>
                                                        <p className="text-xs text-[#475569] leading-relaxed">
                                                            Clear consultation fees and treatment costs displayed upfront - no hidden charges
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                           
                                            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                                                <div className="flex items-start mb-2">
                                                    <MapPin className="w-5 h-5 text-[#0284c7] mr-2 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <h3 className="text-sm font-bold text-[#1e293b] mb-1">Easy Location Search</h3>
                                                        <p className="text-xs text-[#475569] leading-relaxed">
                                                            Find clinics near you with accurate distance calculations and one-click directions
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                       
                                        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-5 border border-white/50">
                                            <h3 className="text-base font-bold text-[#1e293b] mb-3 text-center">Why Choose ZEVA Healthcare?</h3>
                                            <div className="grid sm:grid-cols-2 gap-3 text-xs text-[#475569]">
                                                <div className="flex items-start">
                                                    <span className="text-[#0284c7] font-bold mr-2 text-base">•</span>
                                                    <span>Authentic Ayurveda treatments from certified practitioners</span>
                                                </div>
                                                <div className="flex items-start">
                                                    <span className="text-[#0284c7] font-bold mr-2 text-base">•</span>
                                                    <span>Comprehensive clinic profiles with photos and services</span>
                                                </div>
                                                <div className="flex items-start">
                                                    <span className="text-[#0284c7] font-bold mr-2 text-base">•</span>
                                                    <span>Advanced search filters for price, rating, and availability</span>
                                                </div>
                                                <div className="flex items-start">
                                                    <span className="text-[#0284c7] font-bold mr-2 text-base">•</span>
                                                    <span>Secure booking and enquiry system for patient safety</span>
                                                </div>
                                            </div>
                                        </div>
                                       
                                        <div className="mt-5 pt-5 border-t border-[#cbd5e1]">
                                            <p className="text-sm text-[#475569] text-center leading-relaxed">
                                                <strong className="text-[#1e293b]">Search Tip:</strong> Try searching by location (city, area), treatment type (Panchakarma, Abhyanga), or clinic name to discover the best Ayurveda healthcare providers in your area.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                                        {paginatedClinics.map((clinic, index) => {
                                        const hasRating = clinicReviews[clinic._id]?.totalReviews > 0;
                                        const reviewsLoaded = clinicReviews[clinic._id] !== undefined;

                                        return (
                                            <div
                                                key={index}
                                                className="bg-white rounded-2xl border overflow-hidden hover:shadow-xl transition h-full flex flex-col group"
                                            >
                                                {/* Clinic Image */}
                                                <div className="relative bg-gray-100 overflow-hidden" style={{ aspectRatio: '4/3' }}>
                                                    {clinic.photos && clinic.photos.length > 0 ? (
                                                        <div className="relative w-full h-full">
                                                            {(() => {
                                                                const photos = (clinic.photos || []).filter(photo => photo);
                                                                const currentIndex = photoIndexByClinic[clinic._id] !== undefined ? photoIndexByClinic[clinic._id] : (photos.length > 0 ? photos.length - 1 : 0);
                                                                const currentPhoto = photos.length > 0 ? photos[currentIndex] : null;
                                                                return currentPhoto ? (
                                                                    <img
                                                                        src={normalizeImagePath(currentPhoto)}
                                                                        alt={clinic.name || "Clinic Image"}
                                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                                        style={{
                                                                            objectFit: 'cover',
                                                                            width: '100%',
                                                                            height: '100%',
                                                                            display: 'block'
                                                                        }}
                                                                        onError={(e) => {
                                                                            e.currentTarget.src = "/image1.png";
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                                        <div className="text-center">
                                                                            <div className="w-12 h-12 bg-teal-800 rounded-full flex items-center justify-center mx-auto mb-2">
                                                                                <HeartPulse className="w-6 h-6 text-white" />
                                                                            </div>
                                                                            <span className="text-sm text-teal-800 font-medium">
                                                                                {clinic.name}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                            <div className="text-center">
                                                                <div className="w-12 h-12 bg-teal-800 rounded-full flex items-center justify-center mx-auto mb-2">
                                                                    <HeartPulse className="w-6 h-6 text-white" />
                                                                </div>
                                                                <span className="text-sm text-teal-800 font-medium">
                                                                    {clinic.name}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Badge Overlay */}
                                                    {/* <span className="absolute top-3 left-3 bg-amber-300 px-3 py-1 rounded-full text-xs font-semibold">
                                                        {clinicReviews[clinic._id]?.averageRating >= 4.8 ? "Top Rated" : clinic.isDubaiPrioritized ? "Premium" : "Most Booked"}
                                                    </span> */}

                                                    {/* Verified Overlay */}
                                                    <span className="absolute top-3 right-3 w-8 h-8 bg-teal-800 text-white rounded-full flex items-center justify-center z-20">
                                                        <Shield className="w-4 h-4" />
                                                    </span>

                                                    {clinic.photos && clinic.photos.length > 1 && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const photos = (clinic.photos || []).filter(p => p);
                                                                    if (photos.length > 1) {
                                                                        const currentIndex = photoIndexByClinic[clinic._id] !== undefined ? photoIndexByClinic[clinic._id] : (photos.length - 1);
                                                                        const prevIndex = (currentIndex - 1 + photos.length) % photos.length;
                                                                        setPhotoIndexByClinic(prev => ({ ...prev, [clinic._id]: prevIndex }));
                                                                    }
                                                                }}
                                                                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-[#0f172a] hover:bg-white hover:text-[#0284c7] rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 z-20 border border-white/50"
                                                                aria-label="Previous photo"
                                                                title="Previous photo"
                                                            >
                                                                <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const photos = (clinic.photos || []).filter(p => p);
                                                                    if (photos.length > 1) {
                                                                        const currentIndex = photoIndexByClinic[clinic._id] !== undefined ? photoIndexByClinic[clinic._id] : (photos.length - 1);
                                                                        const nextIndex = (currentIndex + 1) % photos.length;
                                                                        setPhotoIndexByClinic(prev => ({ ...prev, [clinic._id]: nextIndex }));
                                                                    }
                                                                }}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-[#0f172a] hover:bg-white hover:text-[#0284c7] rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 z-20 border border-white/50"
                                                                aria-label="Next photo"
                                                                title="Next photo"
                                                            >
                                                                <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Distance Overlay */}
                                                    {clinic.distance && (
                                                        <div className="absolute bottom-3 left-3 bg-teal-800 text-white px-2 py-1 rounded-md text-[10px] font-bold flex items-center z-20">
                                                            <Navigation className="w-2.5 h-2.5 mr-1" />
                                                            {formatDistance(clinic.distance)}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Clinic Info */}
                                                <div className="p-4 flex-1 flex flex-col">
                                                    <div className="flex justify-between gap-2">
                                                        <div className="font-semibold text-gray-900 line-clamp-1 group-hover:text-teal-800 transition-colors">
                                                            {clinic.name}
                                                        </div>
                                                        <div className="text-amber-500 text-sm font-semibold whitespace-nowrap">
                                                            {clinic.listingVisibility?.showReviews !== false && (
                                                                <>★ {reviewsLoaded ? (clinicReviews[clinic._id]?.averageRating || 0).toFixed(1) : "0.0"}</>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {clinic.listingVisibility?.showServices !== false ? (
                                                            clinic.services?.slice(0, 2).map((s) => (
                                                                <span
                                                                    key={s}
                                                                    className="text-[10px] px-2 py-1 bg-teal-50 text-teal-800 rounded-full font-medium"
                                                                >
                                                                    {s}
                                                                </span>
                                                            )) || (
                                                                <>
                                                                    <span className="text-[10px] px-2 py-1 bg-teal-50 text-teal-800 rounded-full font-medium">Healthcare</span>
                                                                    <span className="text-[10px] px-2 py-1 bg-teal-50 text-teal-800 rounded-full font-medium">Wellness</span>
                                                                </>
                                                            )
                                                        ) : null}
                                                    </div>

                                                    <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                                                        <MapPin className="w-4 h-4 text-teal-800 shrink-0" />
                                                        <span className="truncate">{clinic.address}</span>
                                                    </div>

                                                    {/* Fee and Actions — always visible */}
                                                    <div className="mt-auto pt-4 flex justify-between items-center">
                                                        {/* Prices — only when toggle is on */}
                                                        {clinic.listingVisibility?.showPrices !== false ? (
                                                        <div>
                                                            <div className="text-[10px] text-gray-500 font-medium">Starting from</div>
                                                            <div className="font-bold text-blue-700 text-sm">
                                                                {clinic.pricing ? `AED ${clinic.pricing}` : "AED —"}
                                                            </div>
                                                        </div>
                                                        ) : <div />}

                                                        {/* Location icon + View Details — always visible */}
                                                        <div className="flex gap-2 items-center">
                                                            {(() => {
                                                                const mapsHref = clinic.address
                                                                    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(clinic.address)}`
                                                                    : clinic.location?.coordinates?.length === 2
                                                                    ? `https://www.google.com/maps/dir/?api=1&destination=${clinic.location.coordinates[1]},${clinic.location.coordinates[0]}`
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
                                                                href={clinic.slug && clinic.slugLocked
                                                                    ? `/clinics/${clinic.slug}`
                                                                    : `/clinics/${clinic._id}`}
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
                                    <div className="flex items-center justify-center gap-3 mt-6 pb-6">
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
                                            className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-gray-200 bg-white hover:bg-gradient-to-br hover:from-[#0284c7] hover:to-[#0ea5e9] hover:border-transparent hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-all duration-200 shadow-sm hover:shadow-md"
                                            title="Previous"
                                            aria-label="Previous page"
                                        >
                                            <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
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
                                            className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-gray-200 bg-white hover:bg-gradient-to-br hover:from-[#0284c7] hover:to-[#0ea5e9] hover:border-transparent hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-all duration-200 shadow-sm hover:shadow-md"
                                            title="Next"
                                            aria-label="Next page"
                                        >
                                            <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
                ) : hasSearched ? (
                    loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#e2e8f0] border-t-[#0284c7]"></div>
                            <span className="ml-3 text-[#475569] text-xs">Searching...</span>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 sm:p-8">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 rounded-full bg-[#fef2f2] flex items-center justify-center mx-auto mb-3">
                                    <Search className="w-8 h-8 text-[#dc2626]" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-[#1e293b] mb-2">No Clinics Found</h3>
                                <p className="text-sm text-[#64748b] mb-1">
                                    Try adjusting your filters or search with different criteria
                                </p>
                            </div>
                           
                            {/* Professional ZEVA Clinics Information Section */}
                            <div className="bg-gradient-to-br from-[#f0f7ff] via-[#e0f2fe] to-[#bae6fd] rounded-xl p-6 sm:p-8 border border-[#cbd5e1] shadow-sm mb-4">
                                <div className="flex items-center mb-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0284c7] to-[#0ea5e9] flex items-center justify-center mr-3 shadow-md">
                                        <HeartPulse className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b]">
                                            ZEVA Healthcare Trust
                                        </h2>
                                        <p className="text-xs sm:text-sm text-[#64748b] mt-0.5">
                                            Your Trusted Ayurveda Healthcare Platform
                                        </p>
                                    </div>
                                </div>
                                       
                                <div className="grid md:grid-cols-2 gap-4 mb-6">
                                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                                        <div className="flex items-start mb-2">
                                            <Shield className="w-5 h-5 text-[#0284c7] mr-2 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h3 className="text-sm font-bold text-[#1e293b] mb-1">Verified Clinics</h3>
                                                <p className="text-xs text-[#475569] leading-relaxed">
                                                    All listed clinics are verified and authenticated Ayurveda practitioners with proper certifications and credentials
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
                                                <h3 className="text-sm font-bold text-[#1e293b] mb-1">Transparent Pricing</h3>
                                                <p className="text-xs text-[#475569] leading-relaxed">
                                                    Clear consultation fees and treatment costs displayed upfront - no hidden charges
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                   
                                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                                        <div className="flex items-start mb-2">
                                            <MapPin className="w-5 h-5 text-[#0284c7] mr-2 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h3 className="text-sm font-bold text-[#1e293b] mb-1">Easy Location Search</h3>
                                                <p className="text-xs text-[#475569] leading-relaxed">
                                                    Find clinics near you with accurate distance calculations and one-click directions
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                       
                                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-5 border border-white/50">
                                    <h3 className="text-base font-bold text-[#1e293b] mb-3 text-center">Why Choose ZEVA Healthcare?</h3>
                                    <div className="grid sm:grid-cols-2 gap-3 text-xs text-[#475569]">
                                        <div className="flex items-start">
                                            <span className="text-[#0284c7] font-bold mr-2 text-base">•</span>
                                            <span>Authentic Ayurveda treatments from certified practitioners</span>
                                        </div>
                                        <div className="flex items-start">
                                            <span className="text-[#0284c7] font-bold mr-2 text-base">•</span>
                                            <span>Comprehensive clinic profiles with photos and services</span>
                                        </div>
                                        <div className="flex items-start">
                                            <span className="text-[#0284c7] font-bold mr-2 text-base">•</span>
                                            <span>Advanced search filters for price, rating, and availability</span>
                                        </div>
                                        <div className="flex items-start">
                                            <span className="text-[#0284c7] font-bold mr-2 text-base">•</span>
                                            <span>Secure booking and enquiry system for patient safety</span>
                                        </div>
                                    </div>
                                </div>
                                       
                                <div className="mt-5 pt-5 border-t border-[#cbd5e1]">
                                    <p className="text-sm text-[#475569] text-center leading-relaxed">
                                        <strong className="text-[#1e293b]">Search Tip:</strong> Try searching by location (city, area), treatment type (Panchakarma, Abhyanga), or clinic name to discover the best Ayurveda healthcare providers in your area.
                                    </p>
                                </div>
                            </div>
                           
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="px-4 py-2 rounded-lg border-2 border-[#e2e8f0] text-[#475569] text-sm font-medium hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-all"
                                >
                                    Reset Filters
                                </button>
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] text-white text-sm font-semibold hover:from-[#0369a1] hover:to-[#0284c7] transition-all shadow-md hover:shadow-lg"
                                >
                                    New Search
                                </button>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-8 sm:p-12">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#f0f7ff] to-[#e0f2fe] flex items-center justify-center mx-auto mb-4 shadow-md">
                                <HeartPulse className="w-10 h-10 text-[#0284c7]" />
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-[#1e293b] mb-3">
                                Welcome to ZEVA Healthcare Directory
                            </h2>
                            <p className="text-base text-[#475569] max-w-2xl mx-auto mb-6">
                            ZEVA connects patients with verified clinics and certified medical professionals in their area. Every listed clinic goes through a verification process to ensure proper credentials, experience, and quality standards. This helps you make informed healthcare decisions without uncertainty.

                            </p>
                        </div>
                       
                        {/* Professional ZEVA Information Section */}
                        <div className="bg-gradient-to-br from-[#f0f7ff] via-[#e0f2fe] to-[#bae6fd] rounded-xl p-6 sm:p-8 border border-[#cbd5e1] shadow-sm mb-6">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start mb-6">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0284c7] to-[#0ea5e9] flex items-center justify-center mr-0 sm:mr-4 mb-4 sm:mb-0 shadow-lg">
                                    <HeartPulse className="w-8 h-8 text-white" />
                                </div>
                                <div className="text-center sm:text-left flex-1">
                                    <h2 className="text-2xl sm:text-3xl font-bold text-[#1e293b] mb-2">
                                        ZEVA Healthcare Trust
                                    </h2>
                                    <p className="text-sm sm:text-base text-[#64748b]">
                                    ZEVA is built on trust and transparency. We focus on connecting patients with clinics that follow ethical practices, provide authentic treatments, and maintain clear communication.

                                    </p>
                                </div>
                            </div>
                           
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm">
                                    <Shield className="w-6 h-6 text-[#0284c7] mb-2" />
                                    <h3 className="text-sm font-bold text-[#1e293b] mb-1">Verified Clinics</h3>
                                    <p className="text-xs text-[#475569] leading-relaxed">
                                        All clinics are verified with proper certifications and credentials
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
                                    <h3 className="text-sm font-bold text-[#1e293b] mb-1">Transparent Pricing</h3>
                                    <p className="text-xs text-[#475569] leading-relaxed">
                                        Clear consultation fees with no hidden charges
                                    </p>
                                </div>
                               
                                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm">
                                    <MapPin className="w-6 h-6 text-[#0284c7] mb-2" />
                                    <h3 className="text-sm font-bold text-[#1e293b] mb-1">Easy Search</h3>
                                    <p className="text-xs text-[#475569] leading-relaxed">
                                        Find clinics by location with accurate directions
                                    </p>
                                </div>
                            </div>
                           
                            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-5 border border-white/50">
                                <h3 className="text-lg font-bold text-[#1e293b] mb-4 text-center">Why Users Trust ZEVA:
</h3>
                                <div className="grid sm:grid-cols-2 gap-3 text-sm text-[#475569]">
                                    <div className="flex items-start">
                                        <span className="text-[#0284c7] font-bold mr-2 text-lg">✓</span>
                                        <span>Verified Clinics – All clinics are checked for certifications and credentials

</span>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="text-[#0284c7] font-bold mr-2 text-lg">✓</span>
                                        <span>Real Patient Reviews – Honest ratings from verified patients
 

</span>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="text-[#0284c7] font-bold mr-2 text-lg">✓</span>
                                        <span>Transparent Pricing – Clear consultation fees with no hidden charges


</span>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="text-[#0284c7] font-bold mr-2 text-lg">✓</span>
                                        <span>Easy Search & Navigation – Accurate location results and directions
                                        </span>
                                    </div>
                                </div>
                            </div>
                           
                            <div className="mt-6 pt-6 border-t border-[#cbd5e1]">
                                <p className="text-sm text-[#475569] text-center leading-relaxed max-w-3xl mx-auto">
                                    <strong className="text-[#1e293b]">Get Started:</strong> Enter your location or use the "Near Me" feature to find verified Ayurveda clinics. You can search by treatment type (Panchakarma, Abhyanga, Shirodhara), clinic name, or browse by location to discover the best healthcare providers near you.
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
           
            {isVisible && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="cursor-pointer fixed bottom-4 right-4 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-full p-2 shadow-sm hover:shadow transition-all"
                    style={{ zIndex: 9999 }}
                    aria-label="Scroll to top"
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M18 15l-6-6-6 6" />
                    </svg>
                </button>
            )}
            </div>
        </>
    );
}
