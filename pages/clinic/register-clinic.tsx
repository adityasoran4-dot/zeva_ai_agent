"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
// import { auth } from "../../lib/firebase";

// import {
//   isSignInWithEmailLink,
//   signInWithEmailLink,
//   sendSignInLinkToEmail,
// } from "firebase/auth";
import axios from "axios";
// import { GoogleMap, Marker } from "@react-google-maps/api";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";

interface SuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuccessPopup: React.FC<SuccessPopupProps> = ({ isOpen, onClose: _onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[99999] p-4"
      style={{
        zIndex: 99999,
        backgroundColor: 'rgba(30, 58, 138, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
        style={{ animation: 'popupIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        {/* Top gradient banner */}
        <div className="h-2 w-full" style={{ background: 'linear-gradient(to right, #00b480, #008f66, #3b82f6)' }} />

        <div className="px-8 py-8 text-center">
          {/* Animated checkmark circle */}
          <div className="relative mx-auto mb-5 w-20 h-20">
            <div
              className="absolute inset-0 rounded-full opacity-20"
              style={{ backgroundColor: '#00b480', animation: 'ping 1.5s ease-out infinite' }}
            />
            <div
              className="relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #00b480, #008f66)' }}
            >
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">
            Registration Complete!
          </h3>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Welcome to <span className="font-semibold text-[#00b480]">ZEVA</span>! Your clinic has been successfully registered.
            <br />Redirecting you to the dashboard...
          </p>

          {/* Info cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-green-50 border border-green-100 rounded-2xl p-3">
              <div className="text-2xl mb-1">🏥</div>
              <p className="text-xs font-semibold text-green-800">Clinic Active</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3">
              <div className="text-2xl mb-1">⏱️</div>
              <p className="text-xs font-semibold text-blue-800">30-Day Trial</p>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-3">
              <div className="text-2xl mb-1">📊</div>
              <p className="text-xs font-semibold text-purple-800">Dashboard Ready</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 rounded-full"
              style={{
                background: 'linear-gradient(to right, #00b480, #3b82f6)',
                animation: 'progressBar 2s ease-in-out forwards',
              }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">Loading your dashboard...</p>
        </div>

        {/* Bottom blue accent */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(to right, #3b82f6, #6366f1)' }} />
      </div>

      <style jsx>{`
        @keyframes popupIn {
          from { opacity: 0; transform: scale(0.7) translateY(30px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes ping {
          0%   { transform: scale(1); opacity: 0.2; }
          80%  { transform: scale(2); opacity: 0; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes progressBar {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
};

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  visible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, visible, onClose }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible || !message) return null;

  const styles = {
    success: "bg-gradient-to-r from-green-100 to-green-200 shadow-green-200",
    error: "bg-gradient-to-r from-red-100 to-red-200 shadow-red-200",
    info: "bg-gradient-to-r from-blue-100 to-blue-200 shadow-blue-200",
  };
  const icons = {
    success: "✓",
    error: "✕",
    info: "ℹ",
  };

  const textColorClasses = {
    success: "text-green-800",
    error: "text-red-800",
    info: "text-blue-800",
  };
  
  const iconColorClasses = {
    success: "text-green-600",
    error: "text-red-600",
    info: "text-blue-600",
  };

  const hoverColorClasses = {
    success: "hover:text-green-900",
    error: "hover:text-red-900",
    info: "hover:text-blue-900",
  };

  return (
    <div
      className={`fixed top-20 right-4 z-[9999] ${styles[type]} ${textColorClasses[type]} px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[320px] max-w-[90vw] animate-slide-in backdrop-blur-sm`}
      style={{ 
        animation: 'slideInRight 0.3s ease-out',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
      }}
    >
      <span className={`text-2xl font-bold flex-shrink-0 ${iconColorClasses[type]}`}>{icons[type]}</span>
      <span className="flex-1 text-sm font-medium leading-relaxed">{message}</span>
      <button
        onClick={onClose}
        className={`${textColorClasses[type]} opacity-80 ${hoverColorClasses[type]} text-2xl font-bold flex-shrink-0 hover:bg-white/30 rounded-full w-6 h-6 flex items-center justify-center transition-all`}
        aria-label="Close"
      >
        ×
      </button>
      <style jsx>{`
        @keyframes slideInRight {
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
    </div>
  );
};

interface ContactInfo {
  name: string;
  phone: string;
  website?: string;
}

interface FormState {
  email: string;
  name: string;
  address: string;
  pricing: string;
  timings: string;
  latitude: number;
  longitude: number;
}

interface Errors {
  name?: string;
  treatments?: string;
  address?: string;
  location?: string;
  clinicPhoto?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  emailVerification?: string;
  password?: string;
}

interface TreatmentType {
  name: string;
  slug: string;
}

interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}

const RegisterClinic = (): React.ReactNode => {
  const router = useRouter();
  // Removed currentStep - now single page form
  // Email verification is currently disabled - all registrations proceed without email verification
  // const [emailVerified, _setEmailVerified] = useState<boolean>(false);
  // const _setEmailSent = useState<boolean>(false)[1];
  // const _setIsCheckingEmail = useState<boolean>(false)[1];
  const emailVerified = true; // Always true since verification is disabled
  const [ownerPassword, setOwnerPassword] = useState<string>("");
  const [countryCode, setCountryCode] = useState<string>("+91");
  const [showCountryDropdown, setShowCountryDropdown] = useState<boolean>(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    name: "",
    phone: "",
    website: "",
  });
  // Geocoding is currently disabled
  // const [addressDebounceTimer, setAddressDebounceTimer] =
  //   useState<NodeJS.Timeout | null>(null);
  // const [locationDebounceTimer, setLocationDebounceTimer] =
  //   useState<NodeJS.Timeout | null>(null);
  // const _setLocationInput = useState<string>("")[1];
  // Geocoding functions are currently disabled
  // const [geocoder] = useState<google.maps.Geocoder | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);
  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [form, setForm] = useState<FormState>({
    email: "",
    name: "",
    address: "",
    pricing: "",
    timings: "",
    latitude: 0,
    longitude: 0,
  });
  const [_treatments, setTreatments] = useState<TreatmentType[]>([]);
  const [selectedTreatments, _setSelectedTreatments] = useState<
    (TreatmentType | string)[]
  >([]);

  const [otherTreatments, setOtherTreatments] = useState<string[]>([]);
  const [newOther, setNewOther] = useState<string>("");
  const [clinicPhoto, _setClinicPhoto] = useState<File | null>(null);
  // const [setLicenseDoc] = useState<File | null>(null);
  const [_isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "success",
  });
  const [showToast, setShowToast] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [slugPreview, setSlugPreview] = useState<{
    slug: string;
    url: string;
    user_message: string;
    collision_resolved: boolean;
  } | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState<boolean>(false);
  const slugCheckTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToastMessage = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    setToast({ message, type });
    setShowToast(true);
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
        const response = await axios.post('/api/clinics/check-slug', {
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

  // Removed validateStep - now using single form validation

  // Removed validateForm - now using single form validation in handleSubmit

  // const onMapLoad = useCallback(() => {
  //   const geocoderInstance = new window.google.maps.Geocoder();
  //   setGeocoder(geocoderInstance);
  // }, []);

  // Geocoding functions are currently disabled (map UI is commented out)
  // const geocodeAddress = useCallback(
  //   (address: string) => {
  //     if (!geocoder || !address.trim()) return;
  //     geocoder.geocode({ address: address }, (results, status) => {
  //       if (status === "OK" && results && results[0]) {
  //         const location = results[0].geometry.location;
  //         const formattedAddress = results[0].formatted_address || address;
  //         setForm((f) => ({
  //           ...f,
  //           latitude: location.lat(),
  //           longitude: location.lng(),
  //         }));
  //         setLocationInput(formattedAddress);
  //         setErrors((prev) => ({ ...prev, location: undefined }));
  //       }
  //     });
  //   },
  //   [geocoder]
  // );

  // const geocodeLocation = useCallback(
  //   (location: string) => {
  //     if (!geocoder || !location.trim()) {
  //       return;
  //     }
  //     geocoder.geocode({ address: location }, (results, status) => {
  //       if (status === "OK" && results && results[0]) {
  //         const loc = results[0].geometry.location;
  //         setForm((f) => ({
  //           ...f,
  //           latitude: loc.lat(),
  //           longitude: loc.lng(),
  //         }));
  //         showToastMessage("Location updated on map!", "success");
  //         setErrors((prev) => ({ ...prev, location: undefined }));
  //       }
  //     });
  //   },
  //   [geocoder]
  // );

  // const handleAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  //   const newAddress = e.target.value;
  //   setForm((f) => ({ ...f, address: newAddress }));
  //   if (errors.address) setErrors((prev) => ({ ...prev, address: undefined }));
  //   if (addressDebounceTimer) clearTimeout(addressDebounceTimer);
  //   const timer = setTimeout(() => {
  //     if (newAddress.trim().length > 10) geocodeAddress(newAddress);
  //   }, 1000);
  //   setAddressDebounceTimer(timer);
  // };

  // const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const newLocation = e.target.value;
  //   setLocationInput(newLocation);
  //   // Clear location error when user types
  //   if (errors.location) setErrors((prev) => ({ ...prev, location: undefined }));
  //   if (locationDebounceTimer) clearTimeout(locationDebounceTimer);
  //   const timer = setTimeout(() => {
  //     if (newLocation.trim().length > 5) {
  //       geocodeLocation(newLocation);
  //     } else if (newLocation.trim().length === 0) {
  //       // Clear location if input is empty
  //       setForm((f) => ({ ...f, latitude: 0, longitude: 0 }));
  //     }
  //   }, 800);
  //   setLocationDebounceTimer(timer);
  // };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setContactInfo({ ...contactInfo, phone: value });
      if (value.length === 10 && errors.phone) {
        setErrors((prev) => ({ ...prev, phone: undefined }));
      }
    }
  };

  useEffect(() => {
    const fetchTreatments = async () => {
      try {
        const response = await axios.get("/api/clinics/treatments");
        const data = response.data as { success: boolean; treatments: TreatmentType[] };
        if (data.success) {
          setTreatments(data.treatments);
        }
      } catch (err) {
        console.error('Error fetching treatments:', err);
      }
    };
    fetchTreatments();

    // if (isSignInWithEmailLink(auth, window.location.href)) {
    //   const stored = localStorage.getItem("clinicEmail") || "";
    //   signInWithEmailLink(auth, stored, window.location.href)
    //     .then(() => {
    //       setForm((f) => ({ ...f, email: stored || "" }));
    //       setEmailVerified(true);
    //       setEmailSent(true);
    //       showToastMessage("Email verified successfully!", "success");
    //       setErrors((prev) => ({
    //         ...prev,
    //         email: undefined,
    //         emailVerification: undefined,
    //       }));
    //     })
    //     .catch(() => showToastMessage("Invalid verification link", "error"));
    // }
    return () => {
      // Geocoding cleanup disabled
      // if (addressDebounceTimer) clearTimeout(addressDebounceTimer);
      // if (locationDebounceTimer) clearTimeout(locationDebounceTimer);
    };
  }, []);

  // const sendVerificationLink = async () => {
  //   if (!form.email) {
  //     showToastMessage("Please enter an email address", "error");
  //     return;
  //   }
  //
  //   // Validate email format
  //   if (!form.email.includes("@")) {
  //     setErrors((prev) => ({ ...prev, email: "Enter a valid email" }));
  //     showToastMessage("Please enter a valid email address", "error");
  //     return;
  //   }
  //
  //   setIsCheckingEmail(true);
  //   setErrors((prev) => ({ ...prev, email: undefined }));
  //
  //   try {
  //     // First check if email already exists in database
  //     const checkResponse = await axios.post('/api/clinics/check-email', { email: form.email });
  //     
  //     // If email exists (status 200), show error message
  //     if (checkResponse.status === 200) {
  //       showToastMessage("This email already exist", "error");
  //       setErrors((prev) => ({ ...prev, email: "This email already exist" }));
  //       setIsCheckingEmail(false);
  //       return;
  //     }
  //   } catch (error: any) {
  //     // If email doesn't exist (404), proceed to send verification link
  //     if (axios.isAxiosError(error) && error.response?.status === 404) {
  //       // Email doesn't exist, proceed with sending verification link
  //       try {
  //         sendSignInLinkToEmail(auth, form.email, {
  //           url: window.location.href,
  //           handleCodeInApp: true,
  //         });
  //         localStorage.setItem("clinicEmail", form.email);
  //         setEmailSent(true);
  //         showToastMessage("Verification link sent! Check your inbox.", "success");
  //       } catch (firebaseError) {
  //         console.error('Firebase error:', firebaseError);
  //         showToastMessage("Failed to send verification link. Please try again.", "error");
  //       }
  //     } else {
  //       // Other errors
  //       console.error('Error checking email:', error);
  //       showToastMessage("Error checking email. Please try again.", "error");
  //     }
  //     setIsCheckingEmail(false);
  //     return;
  //   }
  //   
  //   setIsCheckingEmail(false);
  // };

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) {
      e.preventDefault();
    }
    
    // Validate only the 5 required fields
    const newErrors: Errors = {};
    
    if (!form.email.trim()) newErrors.email = "Email is required";
    if (!ownerPassword.trim()) newErrors.password = "Password is required";
    if (!form.name.trim()) newErrors.name = "Clinic name is required";
    if (!contactInfo.name.trim()) newErrors.contactName = "Your name is required";
    if (!contactInfo.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(contactInfo.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Phone number must be exactly 10 digits";
    }
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0];
      showToastMessage(newErrors[firstKey as keyof Errors] || "", "error");
      return;
    }

    // Register owner first
    try {
      const ownerResponse = await axios.post("/api/clinics/registerOwner", {
        email: form.email,
        password: ownerPassword,
        name: contactInfo.name,
        phone: countryCode + contactInfo.phone,
      });
      
      if (!ownerResponse.data.success) {
        showToastMessage(ownerResponse.data.message || "Owner registration failed", "error");
        return;
      }
      
      console.log("Owner registered successfully:", ownerResponse.data);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || "Unknown error occurred while registering owner.";
      if (err?.response?.status === 409) {
        showToastMessage("This email is already registered. Please use a different email or login.", "error");
        setErrors((prev) => ({ ...prev, email: "This email is already registered" }));
      } else {
        showToastMessage(`Registration failed: ${errorMessage}`, "error");
      }
      console.error("Owner registration error:", err);
      return;
    }

    // Small delay to ensure user is fully saved in database
    await new Promise(resolve => setTimeout(resolve, 500));

    // Register clinic
    const data = new FormData();
    data.append("email", form.email);
    data.append("name", form.name);
    data.append("address", form.address || "");
    data.append("latitude", form.latitude.toString());
    data.append("longitude", form.longitude.toString());
    data.append("contactName", contactInfo.name);
    data.append("phone", countryCode + contactInfo.phone);
    data.append("website", contactInfo.website || "");
    
    if (clinicPhoto) data.append("clinicPhoto", clinicPhoto);

    try {
      const registerResponse = await axios.post("/api/clinics/register", data);
      console.log("Clinic registered successfully:", registerResponse.data);
      
      // Auto-login after successful registration
      try {
        const loginResponse = await axios.post("/api/clinics/clinic-login", {
          email: form.email,
          password: ownerPassword,
        });
        
        if (loginResponse.data.token) {
          // Store token in localStorage
          localStorage.setItem("clinicToken", loginResponse.data.token);
          localStorage.setItem("clinicUser", JSON.stringify(loginResponse.data.user));
          
          // Store trial info in sessionStorage for sidebar countdown timer
          if (loginResponse.data.trial) {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('clinicTrialInfo', JSON.stringify(loginResponse.data.trial));
            }
            
            // Check if trial is expired
            if (loginResponse.data.trial.isExpired) {
              console.warn('Trial expired immediately after registration!');
            }
          }
          
          // Show success message
          setShowSuccessPopup(true);
          
          // Reset form fields
          setForm({
            email: "",
            name: "",
            address: "",
            pricing: "",
            timings: "",
            latitude: 0,
            longitude: 0,
          });
          setContactInfo({
            name: "",
            phone: "",
            website: "",
          });
          setOwnerPassword("");
          setErrors({});
          setSlugPreview(null);
          
          // Optionally redirect to dashboard after a short delay
          setTimeout(() => {
            router.push("/clinic/clinic-dashboard");
          }, 2000);
        }
      } catch (loginErr: any) {
        console.error("Auto-login failed:", loginErr);
        // Still show success popup even if auto-login fails
        setShowSuccessPopup(true);
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || "Clinic registration failed";
      showToastMessage(errorMessage, "error");
    }
  };


  // const handleTreatmentSelect = (treatment: TreatmentType | string) => {
  //   const alreadySelected = selectedTreatments.some((t) => {
  //     if (typeof t === "string" && typeof treatment === "string") {
  //       return t === treatment;
  //     } else if (typeof t === "object" && typeof treatment === "object") {
  //       return t.slug === treatment.slug;
  //     }
  //     return false;
  //   });

  //   if (alreadySelected) {
  //     setSelectedTreatments((prev) =>
  //       prev.filter((t) => {
  //         if (typeof t === "string" && typeof treatment === "string") {
  //           return t !== treatment;
  //         } else if (typeof t === "object" && typeof treatment === "object") {
  //           return t.slug !== treatment.slug;
  //         }
  //         return true;
  //       })
  //     );
  //     if (typeof treatment === "string" && treatment === "other") {
  //       setOtherTreatments([]);
  //     }
  //   } else {
  //     setSelectedTreatments((prev) => [...prev, treatment]);
  //   }

  //   if (typeof treatment === "string" && treatment === "other") {
  //     setIsDropdownOpen(false);
  //   }
  // };

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files && e.target.files[0]) {
  //     const file = e.target.files[0];
  //     if (file.size > 1024 * 1024) {
  //       showToastMessage("Please Upload File Less Than 1MB", "error");
  //       return;
  //     }
  //     setClinicPhoto(file);
  //     if (errors.clinicPhoto)
  //       setErrors((prev) => ({ ...prev, clinicPhoto: undefined }));
  //   }
  // };

  // const handleLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files && e.target.files[0]) {
  //     const file = e.target.files[0];
  //     if (file.size > 1024 * 1024) {
  //       showToastMessage("Please Upload File Less Than 1MB", "error");
  //       return;
  //     }
  //     setLicenseDoc(file);
  //   }
  // };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const registrationRef = useRef<HTMLDivElement>(null);

  // Country codes list
  const countryCodes = [
    { code: "+91", country: "India", flag: "🇮🇳" },
    { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
    { code: "+44", country: "UK", flag: "🇬🇧" },
    { code: "+971", country: "UAE", flag: "🇦🇪" },
    { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
    { code: "+61", country: "Australia", flag: "🇦🇺" },
    { code: "+86", country: "China", flag: "🇨🇳" },
    { code: "+49", country: "Germany", flag: "🇩🇪" },
    { code: "+33", country: "France", flag: "🇫🇷" },
    { code: "+81", country: "Japan", flag: "🇯🇵" },
  ];

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        visible={showToast}
        onClose={() => setShowToast(false)}
      />

      <div className="bg-gradient-to-br from-slate-50 to-white py-8">
        <div className="grid lg:grid-cols-2 max-w-7xl mx-auto">
          
          {/* Left Side - Registration Form */}
          <div className="flex items-start justify-center p-4 lg:p-6">
            <div className="w-full max-w-4xl">
              
              {/* Header */}
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#00b480] to-[#008f66] rounded-full mb-3 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-black mb-1">
                  Clinic Registration
                </h1>
                <p className="text-black/70 text-sm">
                  Join ZEVA's network of healthcare centers
                </p>
              </div>

              {/* Form */}
              <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100" ref={registrationRef}>
                <form onSubmit={handleSubmit} className="space-y-3">
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
                            {slugPreview.collision_resolved ? '🔗 Your Unique Clinic URL:' : '🔗 Your Clinic URL:'}
                          </p>
                          <a
                            href={slugPreview.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#00b480] hover:underline break-all font-mono"
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

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-black mb-1.5">
                      Email ID
                    </label>
                    <div className="relative">
                      <svg className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <input
                        name="email"
                        type="email"
                        placeholder="healthcare@example.com"
                        className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 transition-all text-sm text-black placeholder-black/50 outline-none ${
                          errors.email
                            ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                            : "border-gray-300 focus:border-[#00b480] focus:ring-[#00b480]/20"
                        }`}
                        onChange={(e) => {
                          setForm({ ...form, email: e.target.value });
                          if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                        }}
                        value={form.email || ""}
                        required
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-0.5">{errors.email}</p>
                    )}
                  </div>

                  {/* Center Name and Contact Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-black mb-1.5">
                       Bussiness Name 
                      </label>
                      <input
                        placeholder="Green Valley Wellness"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-all text-sm text-black placeholder-black/50 outline-none ${
                          errors.name
                            ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                            : "border-gray-300 focus:border-[#00b480] focus:ring-[#00b480]/20"
                        }`}
                        value={form.name}
                        onChange={(e) => {
                          setForm((f) => ({ ...f, name: e.target.value }));
                          if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                          checkSlugAvailability(e.target.value, form.address);
                        }}
                        required
                      />
                      {errors.name && (
                        <p className="text-red-500 text-xs mt-0.5">{errors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-black mb-1.5">
                        Your Full Name 
                      </label>
                      <div className="relative">
                        <svg className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <input
                          placeholder="Dr. John Smith"
                          className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 transition-all text-sm text-black placeholder-black/50 outline-none ${
                            errors.contactName
                              ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                              : "border-gray-300 focus:border-[#00b480] focus:ring-[#00b480]/20"
                          }`}
                          value={contactInfo.name}
                          onChange={(e) => {
                            setContactInfo({ ...contactInfo, name: e.target.value });
                            if (errors.contactName) setErrors((prev) => ({ ...prev, contactName: undefined }));
                          }}
                          required
                        />
                      </div>
                      {errors.contactName && (
                        <p className="text-red-500 text-xs mt-0.5">{errors.contactName}</p>
                      )}
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-medium text-black mb-1.5">
                      Phone Number 
                    </label>
                    <div className="flex gap-2">
                      {/* Country Code Dropdown */}
                      <div className="relative" ref={dropdownRef}>
                        <button
                          type="button"
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          className="h-[38px] px-3 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-[#00b480]/20 focus:border-[#00b480] transition-all text-sm text-black whitespace-nowrap flex items-center gap-1.5"
                        >
                          <span className="text-base">
                            {countryCodes.find(c => c.code === countryCode)?.flag || "🇮🇳"}
                          </span>
                          <span className="font-medium">{countryCode}</span>
                          <svg className={`w-3 h-3 text-gray-500 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {/* Dropdown Menu */}
                        {showCountryDropdown && (
                          <div className="absolute z-20 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                            {countryCodes.map((country) => (
                              <button
                                key={country.code}
                                type="button"
                                onClick={() => {
                                  setCountryCode(country.code);
                                  setShowCountryDropdown(false);
                                }}
                                className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm ${
                                  countryCode === country.code ? 'bg-[#00b480]/10 text-[#00b480]' : ''
                                }`}
                              >
                                <span className="text-base">{country.flag}</span>
                                <span className="font-medium">{country.code}</span>
                                <span className="text-gray-500 text-xs">{country.country}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Phone Input */}
                      <div className="flex-1 relative">
                        <svg className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <input
                          type="tel"
                          placeholder="1234567890"
                          className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 transition-all text-sm text-black placeholder-black/50 outline-none ${
                            errors.phone
                              ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                              : "border-gray-300 focus:border-[#00b480] focus:ring-[#00b480]/20"
                          }`}
                          value={contactInfo.phone}
                          onChange={handlePhoneChange}
                          maxLength={10}
                          required
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">10-digit mobile number</p>
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-0.5">{errors.phone}</p>
                    )}
                  </div>


 <div>
                      <label className="block text-xs font-medium text-black mb-1.5">Password </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Create password (min. 8 characters)"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-all text-sm text-black placeholder-black/50 outline-none ${
                            errors.password 
                              ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" 
                              : "border-gray-300 focus:border-[#00b480] focus:ring-[#00b480]/20"
                          }`}
                          value={ownerPassword}
                          onChange={(e) => {
                            setOwnerPassword(e.target.value);
                            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                          }}
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-red-500 text-xs mt-0.5">{errors.password}</p>
                      )}
                    </div>

                    {/* Website (Optional) */}
                    <div>
                      <label className="block text-xs font-medium text-black mb-1.5">
                        Website (Optional)
                      </label>
                      <div className="relative">
                        <svg className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <input
                          type="url"
                          placeholder="https://www.example.com"
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b480]/20 focus:border-[#00b480] transition-all text-sm text-black placeholder-black/50 outline-none"
                          value={contactInfo.website || ""}
                          onChange={(e) => {
                            setContactInfo({ ...contactInfo, website: e.target.value });
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Your clinic's website URL</p>
                    </div>








                  {/* Services Offered */}
                  {/* <div className="relative text-black" ref={dropdownRef}>
                    <label className="block text-xs font-medium text-black mb-1.5">
                      Services Offered * {!emailVerified && <span className="text-gray-500 text-xs">(Verify email first)</span>}
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      disabled={!emailVerified}
                      className={`w-full px-3 py-2 border rounded-lg text-left flex items-center justify-between focus:ring-2 transition-all text-sm ${
                        emailVerified 
                          ? errors.treatments
                            ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 bg-gray-50 hover:bg-white"
                            : "border-gray-300 focus:border-[#00b480] focus:ring-[#00b480]/20 bg-gray-50 hover:bg-white"
                          : "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60"
                      }`}
                    >
                      <div className="flex-1">
                        {selectedTreatments.length === 0 && otherTreatments.length === 0 ? (
                          <span className="text-gray-400 text-sm">Select services...</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {selectedTreatments.filter(t => t !== "other").slice(0, 2).map((treatment, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-[#00b480]/10 text-[#00b480]"
                              >
                                {typeof treatment === "string" ? treatment : treatment.name}
                              </span>
                            ))}
                            {otherTreatments.length > 0 && (
                              <span className="text-xs text-[#00b480]">+{otherTreatments.length} custom</span>
                            )}
                            {(selectedTreatments.filter(t => t !== "other").length + otherTreatments.length) > 2 && (
                              <span className="text-xs text-gray-500">...</span>
                            )}
                          </div>
                        )}
                      </div>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isDropdownOpen && emailVerified && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                        <div className="p-1">
                          {treatments.map((treatment, index) => (
                            <div
                              key={index}
                              onClick={() => handleTreatmentSelect(treatment)}
                              className={`px-3 py-1.5 cursor-pointer rounded text-xs ${
                                selectedTreatments.some((t) => typeof t === "object" && t.slug === treatment.slug)
                                  ? "bg-[#00b480]/10 text-[#00b480]"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              {treatment.name}
                            </div>
                          ))}
                          <div
                            onClick={() => handleTreatmentSelect("other")}
                            className={`px-3 py-1.5 cursor-pointer rounded border-t text-xs ${
                              selectedTreatments.includes("other") ? "bg-[#00b480]/10 text-[#00b480]" : "hover:bg-gray-50"
                            }`}
                          >
                            Other Services
                          </div>
                        </div>
                      </div>
                    )}
                    {errors.treatments && (
                      <p className="text-red-500 text-xs mt-0.5">{errors.treatments}</p>
                    )}
                  </div> */}

                  {/* Custom Treatments Input */}
                  {selectedTreatments.includes("other") && emailVerified && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                        Add Custom Services (Max 5)
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Enter service name"
                          className="text-gray-900 flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00b480] focus:outline-none bg-white text-sm"
                          value={newOther}
                          onChange={(e) => setNewOther(e.target.value)}
                          onKeyPress={async (e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const trimmedService = newOther.trim();
                              if (trimmedService && otherTreatments.length < 5) {
                                if (!otherTreatments.includes(trimmedService)) {
                                  // Check if treatment already exists in database
                                  try {
                                    const treatmentsResponse = await axios.get("/api/doctor/getTreatment");
                                    const allTreatments = treatmentsResponse.data.treatments || [];
                                    const normalizedService = trimmedService.toLowerCase();
                                    const existsInDatabase = allTreatments.some((t: any) =>
                                      t.name?.toLowerCase().trim() === normalizedService
                                    );
                                    
                                    if (existsInDatabase) {
                                      showToastMessage("Treatment already exist", "error");
                                      return;
                                    }
                                    
                                    setOtherTreatments([...otherTreatments, trimmedService]);
                                    setNewOther("");
                                    showToastMessage("Custom service added!", "success");
                                  } catch (error) {
                                    // If check fails, still allow adding locally
                                    setOtherTreatments([...otherTreatments, trimmedService]);
                                    setNewOther("");
                                    showToastMessage("Custom service added!", "success");
                                  }
                                } else {
                                  showToastMessage("Service already added", "info");
                                }
                              } else if (otherTreatments.length >= 5) {
                                showToastMessage("Maximum 5 custom services allowed", "error");
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const trimmedService = newOther.trim();
                            if (trimmedService && otherTreatments.length < 5) {
                              if (!otherTreatments.includes(trimmedService)) {
                                // Check if treatment already exists in database
                                try {
                                  const treatmentsResponse = await axios.get("/api/doctor/getTreatment");
                                  const allTreatments = treatmentsResponse.data.treatments || [];
                                  const normalizedService = trimmedService.toLowerCase();
                                  const existsInDatabase = allTreatments.some((t: any) =>
                                    t.name?.toLowerCase().trim() === normalizedService
                                  );
                                  
                                  if (existsInDatabase) {
                                    showToastMessage("Treatment already exist", "error");
                                    return;
                                  }
                                  
                                  setOtherTreatments([...otherTreatments, trimmedService]);
                                  setNewOther("");
                                  showToastMessage("Custom service added!", "success");
                                } catch (error) {
                                  // If check fails, still allow adding locally
                                  setOtherTreatments([...otherTreatments, trimmedService]);
                                  setNewOther("");
                                  showToastMessage("Custom service added!", "success");
                                }
                              } else {
                                showToastMessage("Service already added", "info");
                              }
                            } else if (otherTreatments.length >= 5) {
                              showToastMessage("Maximum 5 custom services allowed", "error");
                            }
                          }}
                          disabled={otherTreatments.length >= 5}
                          className={`px-3 py-2 rounded-lg font-semibold text-xs whitespace-nowrap ${
                            otherTreatments.length >= 5
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-[#00b480] text-white hover:bg-[#009973]"
                          }`}
                        >
                          Add
                        </button>
                      </div>
                      {otherTreatments.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-600">Added services ({otherTreatments.length}/5):</p>
                          <div className="flex flex-wrap gap-1">
                            {otherTreatments.map((treatment, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-lg text-xs bg-[#00b480] text-white"
                              >
                                {treatment}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOtherTreatments(otherTreatments.filter((_, i) => i !== index));
                                    showToastMessage("Service removed", "info");
                                  }}
                                  className="ml-1.5 hover:bg-[#008f66] rounded-full w-4 h-4 flex items-center justify-center"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Address */}
                  {/* <div>
                    <label className="block text-xs font-medium text-black mb-1.5">
                      Address * {!emailVerified && <span className="text-gray-500 text-xs">(Verify email first)</span>}
                    </label>
                    <textarea
                      placeholder="Enter detailed address: Street, Building, Area, City, State, Pincode"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all resize-none text-sm text-black placeholder-black/50 ${
                        emailVerified 
                          ? errors.address
                            ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                            : "border-gray-300 focus:border-[#00b480] focus:ring-[#00b480]/20"
                          : "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60"
                      }`}
                      value={form.address}
                      onChange={(e) => {
                        handleAddressChange(e);
                        checkSlugAvailability(form.name, e.target.value);
                      }}
                      rows={3}
                      disabled={!emailVerified}
                      required
                    />
                    {errors.address && (
                      <p className="text-red-500 text-xs mt-0.5">{errors.address}</p>
                    )}
                  </div> */}

                  {/* Price Range and Hours */}
                  {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-black mb-1.5">
                        Price Range {!emailVerified && <span className="text-gray-500 text-xs">(Verify email first)</span>}
                      </label>
                      <input
                        placeholder="500-2000"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-all text-sm text-black placeholder-black/50 outline-none ${
                          emailVerified 
                            ? "border-gray-300 focus:border-[#00b480] focus:ring-[#00b480]/20" 
                            : "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60"
                        }`}
                        value={form.pricing}
                        onChange={(e) => setForm((f) => ({ ...f, pricing: e.target.value }))}
                        disabled={!emailVerified}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-black mb-1.5">
                        Hours {!emailVerified && <span className="text-gray-500 text-xs">(Verify email first)</span>}
                      </label>
                      <input
                        placeholder="9 AM - 6 PM"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-all text-sm text-black placeholder-black/50 outline-none ${
                          emailVerified 
                            ? "border-gray-300 focus:border-[#00b480] focus:ring-[#00b480]/20" 
                            : "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60"
                        }`}
                        value={form.timings}
                        onChange={(e) => setForm((f) => ({ ...f, timings: e.target.value }))}
                        disabled={!emailVerified}
                      />
                    </div>
                  </div> */}

                  {/* Location with Map */}
                  {/* <div>
                    <label className="block text-xs font-medium text-black mb-1.5">
                      Location <span className="text-red-500">*</span> {!emailVerified && <span className="text-gray-500 text-xs">(Verify email first)</span>}
                    </label>
                    <input
                      type="text"
                      placeholder="Type address or location (e.g., Noida Sector 5)"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-all text-sm text-black placeholder-black/50 outline-none mb-1.5 ${
                        emailVerified 
                          ? errors.location
                            ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                            : "border-gray-300 focus:border-[#00b480] focus:ring-[#00b480]/20"
                          : "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60"
                      }`}
                      value={locationInput}
                      onChange={handleLocationChange}
                      disabled={!emailVerified}
                    />
                    {emailVerified && (
                      <p className="text-xs text-gray-500 mb-1.5">Or click map to pin location</p>
                    )}
                    <div className={`h-40 border-2 rounded-lg overflow-hidden transition-all ${
                      errors.location ? "border-red-400" : "border-gray-300"
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
                              longitude: e.latLng!.lng() 
                            }));
                            setErrors((prev) => ({ ...prev, location: undefined }));
                            if (geocoder) {
                              geocoder.geocode({ location: e.latLng }, (results, status) => {
                                if (status === "OK" && results && results[0]) {
                                  setLocationInput(results[0].formatted_address);
                                  showToastMessage("Location set successfully!", "success");
                                }
                              });
                            } else {
                              showToastMessage("Location set successfully!", "success");
                            }
                          }
                        }}
                      >
                        {form.latitude !== 0 && (
                          <Marker position={{ lat: form.latitude, lng: form.longitude }} />
                        )}
                      </GoogleMap>
                    </div>
                    {errors.location && (
                      <p className="text-red-500 text-xs mt-0.5">{errors.location}</p>
                    )}
                    {form.latitude !== 0 && form.longitude !== 0 && (
                      <p className="text-xs text-green-600 mt-0.5">✓ Location set successfully</p>
                    )}
                  </div> */}

                  {/* File Uploads */}
                  {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-black mb-1.5">
                        Photo * {!emailVerified && <span className="text-gray-500 text-xs">(Verify email first)</span>}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        className={`w-full px-3 py-2 border rounded-lg bg-gray-50 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-[#00b480] file:text-white text-xs transition-all ${
                          emailVerified 
                            ? errors.clinicPhoto
                              ? "border-red-400 focus:border-red-500"
                              : "border-gray-300 focus:border-[#00b480]"
                            : "border-gray-200 bg-gray-100 opacity-60"
                        }`}
                        onChange={handleFileChange}
                        disabled={!emailVerified}
                        required
                      />
                      {errors.clinicPhoto && (
                        <p className="text-red-500 text-xs mt-0.5">{errors.clinicPhoto}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-black mb-1.5">
                        License {!emailVerified && <span className="text-gray-500 text-xs">(Verify email first)</span>}
                      </label>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        className={`w-full px-3 py-2 border rounded-lg bg-gray-50 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-200 file:text-gray-700 text-xs transition-all ${
                          emailVerified 
                            ? "border-gray-300 focus:border-[#00b480]"
                            : "border-gray-200 bg-gray-100 opacity-60"
                        }`}
                        onChange={handleLicenseChange}
                        disabled={!emailVerified}
                      />
                    </div>
                  </div> */}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#00b480] to-[#008f66] text-white py-2 px-6 rounded-lg font-semibold text-sm transition-all duration-200 shadow-lg hover:from-[#008f66] hover:to-[#007a5a] transform hover:-translate-y-0.5 hover:shadow-xl"
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
                    Join thousands of healthcare centers who trust our platform
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
                        <h3 className="font-bold text-gray-900 text-sm mb-1">Comprehensive Dashboard</h3>
                        <p className="text-gray-600 text-xs">
                          Manage your clinic operations with powerful analytics and insights
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
                          Connect with thousands of patients seeking quality healthcare services
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
                          Hire qualified healthcare professionals directly through the platform
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
                        <h3 className="font-bold text-gray-900 text-sm mb-1">Appointment Management</h3>
                        <p className="text-gray-600 text-xs">
                          Streamline scheduling and manage patient appointments efficiently
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
                      24/7 customer support for all clinics
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

      <SuccessPopup isOpen={showSuccessPopup} onClose={() => setShowSuccessPopup(false)} />
    </>
  );
};

export default RegisterClinic;

RegisterClinic.getLayout = function PageLayout(page: React.ReactNode) {
  return <Layout>{page}</Layout>;
};