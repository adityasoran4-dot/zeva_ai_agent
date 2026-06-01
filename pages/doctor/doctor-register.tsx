import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { ChangeEvent, FormEvent } from "react";
import React from "react";
import type { KeyboardEvent } from "react";
import Layout from "@/components/Layout";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { auth } from "../../lib/firebase";
import {
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendSignInLinkToEmail,
} from "firebase/auth";
import { Mail } from "lucide-react";
import { useRouter } from "next/router";

interface SuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const SuccessPopup: React.FC<SuccessPopupProps> = ({ isOpen, onClose }) => {
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRedirect = () => {
    onClose();
    router.push("/");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4" style={{ zIndex: 99999 }}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#2D9AA5' }}>
            <span className="text-3xl text-white">🎉</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Registration Complete!
          </h3>
          <p className="text-sm text-gray-600 mb-5">
            Your profile is under review. We'll notify you once approved.
          </p>
          <button
            onClick={handleRedirect}
            className="text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 hover:opacity-90"
            style={{ background: `linear-gradient(to right, #2D9AA5, #258A94)` }}
          >
            Go to Home Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default function DoctorRegister() {
  const searchRef = useRef<HTMLDivElement>(null);
  const registrationRef = useRef<HTMLDivElement>(null);

  interface TreatmentResponse {
    treatments: { name: string }[];
  }

  // State variables
  const [form, setForm] = useState<{
    name: string;
    phone: string;
    email: string;
    specialization: string;
    degree: string;
    experience: string;
    address: string;
    resume: File | null;
    latitude: number;
    longitude: number;
  }>({
    name: "",
    phone: "",
    email: "",
    specialization: "",
    degree: "",
    experience: "",
    address: "",
    resume: null,
    latitude: 0,
    longitude: 0,
  });

  const [resumeFileName, setResumeFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [specializationType, setSpecializationType] = useState<"dropdown" | "other">("dropdown");
  const [customSpecialization, setCustomSpecialization] = useState("");
  const [treatments, setTreatments] = useState<string[]>([]);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    message: "",
    type: 'info'
  });
  const [locationInput, setLocationInput] = useState<string>("");
  const [locationDebounceTimer, setLocationDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>("");
  const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);
  const [slugPreview, setSlugPreview] = useState<{
    slug: string;
    url: string;
    user_message: string;
    collision_resolved: boolean;
  } | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState<boolean>(false);
  const slugCheckTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch treatments from backend API
  useEffect(() => {
    const fetchTreatments = async () => {
      try {
        const res = await axios.get<TreatmentResponse>("/api/doctor/getTreatment");
        if (res.data && Array.isArray(res.data.treatments)) {
          setTreatments(res.data.treatments.map((t) => t.name));
        }
      } catch {
        setTreatments([]);
      }
    };
    fetchTreatments();

    // Handle Firebase email verification link
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const stored = localStorage.getItem("doctorEmail") || "";
      signInWithEmailLink(auth, stored, window.location.href)
        .then(() => {
          setForm((f) => ({ ...f, email: stored || "" }));
          setEmailVerified(true);
          setEmailSent(true);
          setEmailError("");
          showToast("Email verified successfully!", "success");
        })
        .catch(() => showToast("Invalid verification link", "error"));
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        // Removed unused state variable 'suggestions'
        // setSuggestions([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (locationDebounceTimer) clearTimeout(locationDebounceTimer);
    };
  }, [locationDebounceTimer]);

  // Toast notification function
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: 'info' });
    }, 5000);
  };

  // Check slug availability when name and address change
  const checkSlugAvailability = useCallback(async (name: string, address: string) => {
    if (!name.trim() || !address.trim()) {
      setSlugPreview(null);
      return;
    }

    // Clear previous timer
    if (slugCheckTimerRef.current) {
      clearTimeout(slugCheckTimerRef.current);
    }

    // Debounce slug check
    slugCheckTimerRef.current = setTimeout(async () => {
      setIsCheckingSlug(true);
      try {
        const response = await axios.post('/api/doctor/check-slug', {
          name: name.trim(),
          address: address.trim(),
        });

        if (response.data.success) {
          setSlugPreview({
            slug: response.data.slug,
            url: response.data.url,
            user_message: response.data.user_message,
            collision_resolved: response.data.collision_resolved || false,
          });
        } else {
          setSlugPreview(null);
        }
      } catch (error) {
        console.error('Error checking slug:', error);
        setSlugPreview(null);
      } finally {
        setIsCheckingSlug(false);
      }
    }, 500); // 500ms debounce
  }, []);

  // Send email verification link
  const sendVerificationLink = async () => {
    if (!form.email) {
      showToast("Please enter an email address", "error");
      return;
    }

    // Validate email format
    if (!form.email.includes("@")) {
      setEmailError("Enter a valid email");
      showToast("Please enter a valid email address", "error");
      return;
    }

    setIsCheckingEmail(true);
    setEmailError("");

    try {
      // First check if email already exists in database for doctor role
      const checkResponse = await axios.post('/api/doctor/check-email', { email: form.email });
      
      // If email exists (status 200), show error message
      if (checkResponse.status === 200) {
        showToast("This email already exist", "error");
        setEmailError("This email already exist");
        setIsCheckingEmail(false);
        return;
      }
    } catch (error: any) {
      // If email doesn't exist (404), proceed to send verification link
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // Email doesn't exist for doctor role, proceed with sending verification link
        try {
          sendSignInLinkToEmail(auth, form.email, {
            url: window.location.href,
            handleCodeInApp: true,
          });
          localStorage.setItem("doctorEmail", form.email);
          setEmailSent(true);
          showToast("Verification link sent! Check your inbox.", "success");
        } catch (firebaseError) {
          console.error('Firebase error:', firebaseError);
          showToast("Failed to send verification link. Please try again.", "error");
        }
      } else {
        // Other errors
        console.error('Error checking email:', error);
        showToast("Error checking email. Please try again.", "error");
      }
      setIsCheckingEmail(false);
      return;
    }
    
    setIsCheckingEmail(false);
  };

  // Map load callback
  const onMapLoad = useCallback(() => {
    if (typeof window !== 'undefined' && window.google) {
      const geocoderInstance = new window.google.maps.Geocoder();
      setGeocoder(geocoderInstance);
    }
  }, []);

  // Geocode location function
  const geocodeLocation = useCallback(
    (location: string) => {
      if (!geocoder || !location.trim()) {
        setLocationError("");
        return;
      }
      
      // Try with the location input first
      geocoder.geocode({ address: location }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const loc = results[0].geometry.location;
          setForm((f) => ({
            ...f,
            latitude: loc.lat(),
            longitude: loc.lng(),
          }));
          showToast("Location updated on map!", "success");
          setLocationError("");
        } else if (status === "ZERO_RESULTS") {
          // If location input fails, try with address field
          if (form.address && form.address.trim().length > 5) {
            geocoder.geocode({ address: form.address }, (addressResults, addressStatus) => {
              if (addressStatus === "OK" && addressResults && addressResults[0]) {
                const loc = addressResults[0].geometry.location;
                setForm((f) => ({
                  ...f,
                  latitude: loc.lat(),
                  longitude: loc.lng(),
                }));
                showToast("Location updated using address field!", "success");
                setLocationError("");
              } else {
                setLocationError("");
                // Don't show error toast if user is still typing
              }
            });
          } else {
            setLocationError("");
            // Don't show error if user is still typing
          }
        } else {
          setLocationError("");
          // Don't show persistent error - let user click on map instead
        }
      });
    },
    [geocoder, form.address]
  );

  // Handle location input change
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLocation = e.target.value;
    setLocationInput(newLocation);
    setLocationError(""); // Clear error when user types
    if (locationDebounceTimer) clearTimeout(locationDebounceTimer);
    const timer = setTimeout(() => {
      if (newLocation.trim().length > 3) {
        geocodeLocation(newLocation);
      } else {
        setLocationError("");
      }
    }, 1000); // Increased debounce time for better results
    setLocationDebounceTimer(timer);
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (files && files.length > 0) {
      setForm((prev) => ({ ...prev, [name]: files[0] }));
      if (name === "resume") {
        setResumeFileName(files[0].name);
      }
    } else {
      // Limit phone to 10 digits
      if (name === "phone") {
        const onlyNums = value.replace(/[^0-9]/g, "").slice(0, 10);
        setForm((prev) => ({ ...prev, [name]: onlyNums }));
      } else {
        setForm((prev) => ({ ...prev, [name]: value }));
        
        // Auto-geocode address field if location is not set
        if (name === "address" && value.trim().length > 10) {
          if (locationDebounceTimer) clearTimeout(locationDebounceTimer);
          const timer = setTimeout(() => {
            // Check current form state before geocoding
            setForm((currentForm) => {
              // Only geocode if location is not already set
              if ((currentForm.latitude === 0 || currentForm.longitude === 0) && geocoder) {
                geocoder.geocode({ address: value }, (results, status) => {
                  if (status === "OK" && results && results[0]) {
                    const loc = results[0].geometry.location;
                    setForm((f) => ({
                      ...f,
                      latitude: loc.lat(),
                      longitude: loc.lng(),
                    }));
                    setLocationInput(value);
                    setLocationError("");
                  }
                });
              }
              return currentForm;
            });
          }, 1500);
          setLocationDebounceTimer(timer);
        }
      }
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Email verification validation
    if (!emailVerified) {
      showToast("Please verify your email address before submitting.", 'error');
      setEmailError("Email must be verified");
      return;
    }
    
    // Phone validation: must be exactly 10 digits
    if (!form.phone || form.phone.length !== 10) {
      showToast("Please enter a valid 10-digit phone number.", 'error');
      return;
    }
    // Location validation
    if (form.latitude === 0 && form.longitude === 0) {
      showToast("Please set location on map by typing address or clicking on map.", 'error');
      setLocationError("Location is required");
      return;
    }
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      // Only append if value is not null or undefined
      if (value !== null && value !== undefined) {
        // Convert numbers to strings for FormData
        if (typeof value === 'number') {
          data.append(key, value.toString());
        } else {
          data.append(key, value as string | Blob);
        }
      }
    });
    // Explicitly ensure latitude and longitude are sent
    if (form.latitude !== 0 && form.longitude !== 0) {
      data.append('latitude', form.latitude.toString());
      data.append('longitude', form.longitude.toString());
    }
    try {
      const response = await axios.post("/api/doctor/register", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      // Show slug preview message if available
      if (response.data.slug_preview) {
        showToast(
          response.data.slug_preview.user_message || "Doctor registered successfully!",
          "success"
        );
      } else {
        showToast("Doctor registered successfully!", "success");
      }
      
      // Show success popup
      setShowSuccessPopup(true);
      // Reset the form fields
      setForm({
        name: "",
        phone: "",
        email: "",
        specialization: "",
        degree: "",
        experience: "",
        address: "",
        resume: null,
        latitude: 0,
        longitude: 0,
      });
      setResumeFileName("");
      setLocationInput("");
      setEmailVerified(false);
      setEmailSent(false);
      setEmailError("");
    } catch (err: unknown) {
      let message = "Registration failed";

      interface AxiosErrorWithMessage {
        response?: {
          data?: {
            message?: string;
          };
        };
      }

      const axiosError = err as AxiosErrorWithMessage;

      if (typeof axiosError.response?.data?.message === "string") {
        message = axiosError.response.data.message;
      }

      showToast(message, 'error');
    }
  };

  const handlePhoneKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handlePhoneInput = (e: React.InputEvent<HTMLInputElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, "");
  };

  const handleExperienceKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleExperienceInput = (e: React.InputEvent<HTMLInputElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, "");
  };

return (
  <>
    {/* Toast Notifications */}
    {toast.show && (
      <div className="fixed top-4 right-4 z-9999 max-w-sm">
        <div className={`bg-white rounded-lg p-4 shadow-lg border-l-4 flex items-center gap-3 ${
          toast.type === 'success' ? 'border-emerald-500 animate-[slideIn_0.3s_ease-out]' :
          toast.type === 'error' ? 'border-red-500 animate-[slideIn_0.3s_ease-out]' : 
          'border-blue-500 animate-[slideIn_0.3s_ease-out]'
        }`}>
          <div className="flex-shrink-0">
            {toast.type === 'success' && (
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {toast.type === 'error' && (
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 9l-6 6m0-6l6 6" />
              </svg>
            )}
            {toast.type === 'info' && (
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-black">{toast.message}</p>
            {toast.type === 'success' && (
              <p className="text-xs text-emerald-600 mt-1">
                Redirecting to home page...
              </p>
            )}
          </div>
          <button
            className="text-black hover:text-gray-600 transition-colors p-1 rounded"
            onClick={() => setToast({ show: false, message: "", type: 'info' })}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )}

    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="grid lg:grid-cols-2 min-h-screen">
        
        {/* Left Side - Registration Form */}
        <div className="flex items-start justify-center p-4 lg:p-6 pt-8 lg:pt-10">
          <div className="w-full max-w-4xl">
            
            {/* Header */}
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#2D9AA5] to-cyan-600 rounded-full mb-3 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-black mb-1">
                Doctor Registration
              </h1>
              <p className="text-black/70 text-sm">
                Join ZEVA's network of healthcare professionals
              </p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100" ref={registrationRef}>
              <form onSubmit={handleSubmit} className="space-y-3">

                {/* Name */}
                {/* <div>
                  <label className="block text-sm font-medium text-black mb-2">Full Name *</label>
                  <input
                    name="name"
                    type="text"
                    placeholder="Dr. John Smith"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#2D9AA5] focus:ring-2 focus:ring-[#2D9AA5]/20 transition-all text-black placeholder-black/50 outline-none"
                    onChange={(e) => {
                      handleChange(e);
                      // Check slug when name changes
                      checkSlugAvailability(e.target.value, form.address);
                    }}
                    value={form.name || ""}
                    required
                  />
                </div> */}

                {/* Slug Preview */}
                {slugPreview && form.name.trim() && form.address.trim() && (
                  <div className={`p-3 rounded-lg border-2 ${
                    slugPreview.collision_resolved 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-700 mb-1">
                          {slugPreview.collision_resolved ? '🔗 Your Unique Doctor URL:' : '🔗 Your Profile URL:' }
                        </p>
                        <a
                          href={slugPreview.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#2D9AA5] hover:underline break-all font-mono"
                        >
                          {slugPreview.url}
                        </a>
                        <p className="text-xs text-gray-600 mt-2">
                          {slugPreview.user_message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {isCheckingSlug && form.name.trim() && form.address.trim() && (
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-500">Checking slug availability...</p>
                  </div>
                )}

                {/* Email and Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-black mb-1.5">
                      Email * {emailVerified && <span className="text-green-600 text-xs">✓ Verified</span>}
                    </label>
                    <div className="flex gap-1.5">
                      <div className="flex-1 relative">
                        <Mail className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          name="email"
                          type="email"
                          placeholder="doctor@example.com"
                          className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 transition-all text-sm text-black placeholder-black/50 outline-none ${
                            emailError
                              ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                              : emailVerified
                                ? "border-green-400 focus:border-green-500 focus:ring-green-500/20"
                                : "border-gray-300 focus:border-[#2D9AA5] focus:ring-[#2D9AA5]/20"
                          }`}
                          onChange={(e) => {
                            handleChange(e);
                            if (emailError) setEmailError("");
                            if (emailVerified) {
                              setEmailVerified(false);
                              setEmailSent(false);
                            }
                          }}
                          value={form.email || ""}
                          disabled={emailVerified}
                          required
                        />
                      </div>
                      <button
                        type="button"
                        className={`px-3 py-2 rounded-lg font-semibold whitespace-nowrap transition-all text-xs flex items-center justify-center gap-1 ${
                          emailVerified
                            ? "bg-green-600 text-white"
                            : emailSent
                              ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                              : isCheckingEmail
                                ? "bg-gray-400 text-white cursor-not-allowed"
                                : "bg-gradient-to-r from-[#2D9AA5] to-[#258A94] text-white hover:from-[#258A94] hover:to-[#1d7a84]"
                        }`}
                        onClick={sendVerificationLink}
                        disabled={(emailSent && !emailVerified) || isCheckingEmail}
                      >
                        {emailVerified ? (
                          <>
                            <span>✓</span> Verified
                          </>
                        ) : emailSent ? (
                          "Sent"
                        ) : isCheckingEmail ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Checking...
                          </>
                        ) : (
                          "Verify"
                        )}
                      </button>
                    </div>
                    {emailError && (
                      <p className="text-red-500 text-xs mt-0.5">{emailError}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-1.5">Phone *</label>
                    <input
                      name="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-all text-sm text-black placeholder-black/50 outline-none ${
                        emailVerified 
                          ? "border-gray-300 focus:border-[#2D9AA5] focus:ring-[#2D9AA5]/20" 
                          : "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60"
                      }`}
                      onChange={handleChange}
                      onKeyPress={handlePhoneKeyPress}
                      onInput={handlePhoneInput}
                      value={form.phone || ""}
                      disabled={!emailVerified}
                      required
                    />
                    {!emailVerified && (
                      <p className="text-xs text-gray-500 mt-0.5">Verify email first</p>
                    )}
                  </div>
                </div>
                
                {/* Name and Specialization */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-black mb-1.5">Full Name *</label>
                    <input
                      name="name"
                      type="text"
                      placeholder="Dr. John Smith"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-all text-sm text-black placeholder-black/50 outline-none ${
                        emailVerified 
                          ? "border-gray-300 focus:border-[#2D9AA5] focus:ring-[#2D9AA5]/20" 
                          : "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60"
                      }`}
                      onChange={(e) => {
                        handleChange(e);
                        // Check slug when name changes
                        checkSlugAvailability(e.target.value, form.address);
                      }}
                      value={form.name || ""}
                      disabled={!emailVerified}
                      required
                    />
                    {!emailVerified && (
                      <p className="text-xs text-gray-500 mt-0.5">Verify email first</p>
                    )}
                  </div>
                  <div className="relative">
                    <label className="block text-xs font-medium text-black mb-1.5">Specialization *</label>
                    <select
                      id="specialization"
                      name="specialization"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-all appearance-none text-sm text-black outline-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTUgN0wxMCAxMkwxNSA3IiBzdHJva2U9IiM2QjcyODAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=')] bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat pr-10 ${
                        emailVerified 
                          ? "border-gray-300 focus:border-[#2D9AA5] focus:ring-[#2D9AA5]/20 bg-white" 
                          : "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60"
                      }`}
                      value={
                        specializationType === "dropdown"
                          ? form.specialization
                          : "other"
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          setSpecializationType("dropdown");
                          setForm((prev) => ({
                            ...prev,
                            specialization: "",
                          }));
                          setCustomSpecialization("");
                        } else if (value === "other") {
                          setSpecializationType("other");
                          setForm((prev) => ({
                            ...prev,
                            specialization: "",
                          }));
                        } else {
                          setSpecializationType("dropdown");
                          setForm((prev) => ({
                            ...prev,
                            specialization: value,
                          }));
                        }
                      }}
                      disabled={!emailVerified}
                      required
                    >
                      <option value="" disabled hidden>
                        Select Specialization
                      </option>
                      {treatments.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                      <option value="other">
                        Other
                      </option>
                    </select>
                    {!emailVerified && (
                      <p className="text-xs text-gray-500 mt-0.5">Verify email first</p>
                    )}
                  </div>
                </div>

                {/* Custom Specialization */}
                {specializationType === "other" && (
                  <div>
                    <label className="block text-xs font-medium text-black mb-1.5">Enter Specialization *</label>
                    <input
                      type="text"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-all text-sm text-black placeholder-black/50 outline-none ${
                        emailVerified 
                          ? "border-gray-300 focus:border-[#2D9AA5] focus:ring-[#2D9AA5]/20" 
                          : "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60"
                      }`}
                      placeholder="e.g., Sports Medicine"
                      value={customSpecialization}
                      onChange={(e) => {
                        setCustomSpecialization(e.target.value);
                        setForm((prev) => ({
                          ...prev,
                          specialization: e.target.value,
                        }));
                      }}
                      disabled={!emailVerified}
                      required
                    />
                  </div>
                )}

                {/* Experience and Degree */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-black mb-1.5">Experience (Years) *</label>
                    <input
                      name="experience"
                      type="text"
                      placeholder="5"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-all text-sm text-black placeholder-black/50 outline-none ${
                        emailVerified 
                          ? "border-gray-300 focus:border-[#2D9AA5] focus:ring-[#2D9AA5]/20" 
                          : "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60"
                      }`}
                      onChange={handleChange}
                      onKeyPress={handleExperienceKeyPress}
                      onInput={handleExperienceInput}
                      value={form.experience || ""}
                      disabled={!emailVerified}
                      required
                    />
                    {!emailVerified && (
                      <p className="text-xs text-gray-500 mt-0.5">Verify email first</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-1.5">Degree *</label>
                    <input
                      name="degree"
                      type="text"
                      placeholder="MBBS, MD, etc."
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-all text-sm text-black placeholder-black/50 outline-none ${
                        emailVerified 
                          ? "border-gray-300 focus:border-[#2D9AA5] focus:ring-[#2D9AA5]/20" 
                          : "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60"
                      }`}
                      onChange={handleChange}
                      value={form.degree || ""}
                      disabled={!emailVerified}
                      required
                    />
                    {!emailVerified && (
                      <p className="text-xs text-gray-500 mt-0.5">Verify email first</p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-medium text-black mb-1.5">Clinic Address *</label>
                  <textarea
                    name="address"
                    placeholder="Enter your complete practice address"
                    rows={2}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-all resize-none text-sm text-black placeholder-black/50 outline-none ${
                      emailVerified 
                        ? "border-gray-300 focus:border-[#2D9AA5] focus:ring-[#2D9AA5]/20" 
                        : "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60"
                    }`}
                    onChange={(e) => {
                      handleChange(e);
                      // Check slug when address changes
                      checkSlugAvailability(form.name, e.target.value);
                    }}
                    value={form.address || ""}
                    disabled={!emailVerified}
                    required
                  ></textarea>
                  {!emailVerified && (
                    <p className="text-xs text-gray-500 mt-0.5">Verify email first</p>
                  )}
                </div>

                {/* Location with Map */}
                <div>
                  <label className="block text-xs font-medium text-black mb-1.5">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Type address or location (e.g., Noida Sector 5)"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-all text-sm text-black placeholder-black/50 outline-none mb-1.5 ${
                      emailVerified 
                        ? locationError 
                          ? "border-red-400 focus:border-red-500" 
                          : "border-gray-300 focus:border-[#2D9AA5] focus:ring-[#2D9AA5]/20"
                        : "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60"
                    }`}
                    value={locationInput}
                    onChange={handleLocationChange}
                    disabled={!emailVerified}
                  />
                  {!emailVerified && (
                    <p className="text-xs text-gray-500 mb-1.5">Verify email first</p>
                  )}
                  {emailVerified && (
                    <p className="text-xs text-gray-500 mb-1.5">Or click map to pin location</p>
                  )}
                  <div className={`h-40 border-2 rounded-lg overflow-hidden ${
                    locationError ? "border-red-400" : "border-gray-300"
                  } ${!emailVerified ? "opacity-60 pointer-events-none" : ""}`}>
                    <GoogleMap
                      zoom={form.latitude !== 0 ? 15 : 12}
                      center={{
                        lat: form.latitude !== 0 ? form.latitude : 28.61,
                        lng: form.longitude !== 0 ? form.longitude : 77.2,
                      }}
                      mapContainerStyle={{ width: "100%", height: "100%" }}
                      onLoad={onMapLoad}
                      onClick={(e) => {
                        if (e.latLng && emailVerified) {
                          setForm((f) => ({
                            ...f,
                            latitude: e.latLng!.lat(),
                            longitude: e.latLng!.lng(),
                          }));
                          setLocationError("");
                          // Reverse geocode to update location input
                          if (geocoder) {
                            geocoder.geocode({ location: e.latLng }, (results, status) => {
                              if (status === "OK" && results && results[0]) {
                                setLocationInput(results[0].formatted_address);
                              }
                            });
                          }
                        }
                      }}
                    >
                      {form.latitude !== 0 && (
                        <Marker position={{ lat: form.latitude, lng: form.longitude }} />
                      )}
                    </GoogleMap>
                  </div>
                  {locationError && form.latitude === 0 && form.longitude === 0 && (
                    <p className="text-xs text-red-500 mt-1">{locationError}</p>
                  )}
                  {form.latitude !== 0 && form.longitude !== 0 && (
                    <p className="text-xs text-green-600 mt-1">✓ Location set successfully</p>
                  )}
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-xs font-medium text-black mb-1.5">Upload Resume *</label>
                  <div className="relative">
                    <input
                      type="file"
                      name="resume"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const maxSize = 1024 * 1024;
                          if (file.size > maxSize) {
                            setFileError("File is too large");
                            e.target.value = "";
                            return;
                          }
                          setFileError("");
                          setResumeFileName(file.name);
                          handleChange(e);
                        }
                      }}
                      className={`absolute inset-0 w-full h-full opacity-0 z-10 ${
                        emailVerified ? "cursor-pointer" : "cursor-not-allowed"
                      }`}
                      disabled={!emailVerified}
                      required
                    />
                    <div className={`w-full px-3 py-2 border-2 border-dashed rounded-lg text-sm text-black/60 transition-all text-center ${
                      emailVerified 
                        ? "border-gray-300 bg-gray-50 hover:bg-[#2D9AA5]/5 hover:border-[#2D9AA5]" 
                        : "border-gray-200 bg-gray-100 opacity-60"
                    }`}>
                      {resumeFileName ? `📄 ${resumeFileName}` : "Upload Resume (PDF, DOC, DOCX)"}
                    </div>
                  </div>
                  <div className={`text-xs mt-0.5 ${fileError ? "text-red-500" : "text-black/50"}`}>
                    {fileError || "Max file size: 1MB"}
                  </div>
                  {!emailVerified && (
                    <p className="text-xs text-gray-500 mt-0.5">Verify email first</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className={`w-full bg-gradient-to-r from-[#2D9AA5] to-cyan-600 text-white py-2 px-6 rounded-lg font-semibold text-sm transition-all duration-200 shadow-lg ${
                    emailVerified 
                      ? "hover:from-[#238892] hover:to-cyan-700 transform hover:-translate-y-0.5 hover:shadow-xl" 
                      : "opacity-60 cursor-not-allowed"
                  }`}
                  disabled={!emailVerified}
                >
                  Complete Registration
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Side - Why Register */}
        <div className="hidden lg:flex items-start justify-center p-4 lg:p-6 pt-8 lg:pt-10">
          <div className="w-full max-w-xl">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 lg:p-8 border border-blue-400 mt-24 lg:mt-28">
            
            {/* Header */}
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold mb-2 text-white">Why Register With ZEVA?</h2>
              <p className="text-blue-50 text-sm">
                Join thousands of practitioners who trust our platform
              </p>
            </div>

            {/* Benefits Cards */}
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-md border border-white/30 hover:shadow-lg transition-all hover:scale-[1.02]">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">Personal Dashboard</h3>
                    <p className="text-gray-600 text-xs">
                      Get comprehensive analytics and insights to manage your practice effectively
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-md border border-white/30 hover:shadow-lg transition-all hover:scale-[1.02]">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">Extensive Patient Network</h3>
                    <p className="text-gray-600 text-xs">
                      Connect with thousands of patients seeking trusted healthcare
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-md border border-white/30 hover:shadow-lg transition-all hover:scale-[1.02]">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">Post Job Opportunities</h3>
                    <p className="text-gray-600 text-xs">
                      Hire qualified staff directly through the platform
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-md border border-white/30 hover:shadow-lg transition-all hover:scale-[1.02]">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">Write & Share Blogs</h3>
                    <p className="text-gray-600 text-xs">
                      Share your expertise to establish authority and attract patients
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Features */}
            <div className="mt-4 p-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-white/30">
              <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Additional Benefits
              </h4>
              <ul className="space-y-1.5 text-gray-600 text-xs">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></div>
                  24/7 customer support for all practitioners
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></div>
                  Free marketing tools and promotional materials
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></div>
                  Secure patient data management system
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></div>
                  Regular platform updates and new features
                </li>
              </ul>
            </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <style jsx>{`
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `}</style>
    
    {/* Success Popup */}
    <SuccessPopup isOpen={showSuccessPopup} onClose={() => setShowSuccessPopup(false)} />
  </>
  );
}

DoctorRegister.getLayout = function PageLayout(page: React.ReactNode) {
  return <Layout>{page}</Layout>;
};
