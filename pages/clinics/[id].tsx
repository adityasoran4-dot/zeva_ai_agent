"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import {
  Star,
  MessageCircle,
  Navigation,
  MapPin,
  Clock,
  Award,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  Shield,
  Heart,
  CheckCircle,
  Building2,
  Stethoscope,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext"; // ✅ make sure this path is correct
import AuthModal from "../../components/AuthModal";
import Image from 'next/image';

interface Clinic {
  _id: string;
  name: string;
  address: string;
  photos?: string[];
  servicesName?: string[];
  treatments?: Array<{
    mainTreatment: string;
    mainTreatmentSlug?: string;
    enabled?: boolean;
    subTreatments?: Array<{
      name: string;
      slug?: string;
      price?: number;
      enabled?: boolean;
    }>;
  }>;
  pricing?: string;
  timings?: string | any[];
  listingVisibility?: {
    showServices?: boolean;
    showPrices?: boolean;
    showStaff?: boolean;
    showReviews?: boolean;
    enableOnlineBooking?: boolean;
    featuredListing?: boolean;
  };
  location?: { coordinates: [number, number] };
}

// Helper: render clinic timings (supports both legacy string and new weekly array)
const renderTimings = (timings: string | any[] | undefined): React.ReactNode => {
  if (!timings) return null;
  if (Array.isArray(timings)) {
    const openDays = timings.filter((t: any) => t.isOpen);
    if (openDays.length === 0) return <span>All days closed</span>;
    return (
      <div className="space-y-1 text-sm">
        {openDays.map((t: any) => (
          <div key={t.day} className="flex justify-between gap-4">
            <span className="font-medium w-24">{t.day}</span>
            <span>{t.openingTime} &ndash; {t.closingTime}</span>
          </div>
        ))}
      </div>
    );
  }
  return <span>{timings}</span>;
};
const normalizePhotoUrl = (url: string | undefined): string => {
  if (!url) return '';
  
  // Handle malformed URLs that have localhost concatenated with file path
  // e.g., "http://localhost:3000C:/Users/..." -> extract the file path part
  if (url.includes('localhost') && /[A-Za-z]:/.test(url)) {
    // Find the drive letter (C:, D:, etc.) and extract from there
    const driveMatch = url.match(/([A-Za-z]:.*)/);
    if (driveMatch) {
      url = driveMatch[1];
    }
  }
  
  // Normalize Windows backslashes to forward slashes
  url = url.replace(/\\/g, '/');
  
  // If already a valid absolute URL (http:// or https://), return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Make sure it's a proper URL, not concatenated with file path
    if (!/[A-Za-z]:/.test(url)) {
    return url;
    }
    // If it has a drive letter, it's malformed, extract the path part
    const driveMatch = url.match(/([A-Za-z]:.*)/);
    if (driveMatch) {
      url = driveMatch[1];
    }
  }
  
  // If it's a file system path (contains drive letter), extract the uploads part
  if (url.includes('uploads/') && /[A-Za-z]:/.test(url)) {
    const uploadsIndex = url.indexOf('uploads/');
    const relativePath = '/' + url.substring(uploadsIndex);
    return relativePath;
  }
  
  // If it's a file system path without uploads, try to find the public path
  if (url.includes('public/')) {
    const publicIndex = url.indexOf('public/');
    const relativePath = '/' + url.substring(publicIndex + 7); // +7 to skip "public/"
    return relativePath;
  }
  
  // If it starts with /, return as is (relative URL)
  if (url.startsWith('/')) {
    return url;
  }
  
  // If it contains uploads but no drive letter, make it relative
  if (url.includes('uploads/')) {
    const uploadsIndex = url.indexOf('uploads/');
    return '/' + url.substring(uploadsIndex);
  }
  
  // Otherwise, prepend /uploads/clinic/ if it looks like a filename
  if (url.includes('clinicPhoto') || url.match(/\.(jpg|jpeg|png|gif|avif|webp)$/i)) {
    return '/uploads/clinic/' + url;
  }
  
  // Otherwise, prepend / to make it a relative URL
  return '/' + url;
};

export default function ClinicDetail() {
  const router = useRouter();
  // 'id' from path will be the slug (clinic name)
  const slug = router.query.id as string | undefined;
  // Get the actual clinic ID from query parameter (passed as ?c=... in URL to avoid conflict)
  const clinicId = router.query.c as string | undefined;

  const { isAuthenticated } = useAuth(); // ✅ Auth context

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rating states
  const [clinicReviews, setClinicReviews] = useState<
    Record<string, { averageRating: number; totalReviews: number }>
  >({});
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  const shouldNavigateAfterLogin = useRef(false);
  const pendingClinicData = useRef<{ clinic: Clinic } | null>(null);
  const navigateToReview = useRef(false);

  useEffect(() => {
    if (!router.isReady || !slug) return;
    
    const fetchClinic = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if slug is an ObjectId (for backward compatibility)
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
        
        let res;
        if (isObjectId) {
          // Old ObjectId-based URL - fetch by ObjectId first
          try {
            res = await axios.get(`/api/clinics/${slug}`);
            const clinic = res.data?.clinic || res.data?.data || res.data;
            
            // If clinic has a slug, redirect to slug-based URL
            if (clinic?.slug && clinic?.slugLocked) {
              router.replace(`/clinics/${clinic.slug}`, undefined, { shallow: false });
              return;
            }
          } catch (err: any) {
            // If fetch fails, try redirect API
            try {
              // Redirect API will handle slug generation if needed
              window.location.href = `/api/clinics/redirect/${slug}`;
              return;
            } catch (redirectErr) {
              throw err;
            }
          }
        } else {
          // New slug-based URL - fetch by slug
          try {
            res = await axios.get(`/api/clinics/by-slug/${slug}`);
          } catch (slugErr: any) {
            // If slug fetch fails and we have clinicId in query params, try fetching by ID
            if (slugErr.response?.status === 404 && clinicId) {
              console.log("Slug not found, trying with clinic ID:", clinicId);
              try {
                res = await axios.get(`/api/clinics/${clinicId}`);
                const clinic = res.data?.clinic || res.data?.data || res.data;
                
                // If clinic has a slug, redirect to slug-based URL
                if (clinic?.slug && clinic?.slugLocked) {
                  router.replace(`/clinics/${clinic.slug}`, undefined, { shallow: false });
                  return;
                }
              } catch (idErr: any) {
                // Both slug and ID failed, throw the original slug error
                throw slugErr;
              }
            } else {
              // Re-throw if it's not a 404 or no clinicId available
              throw slugErr;
            }
          }
        }
        
        setClinic(res.data?.clinic || res.data?.data || res.data);
      } catch (err: any) {
        console.error("Error fetching clinic:", err);
        setError(err.response?.data?.message || "Failed to load clinic");
      } finally {
        setLoading(false);
      }
    };
    
    fetchClinic();
  }, [slug, router.isReady, router]);

  useEffect(() => {
    if (!clinic?._id) return;
    const fetchReviews = async () => {
      try {
        const res = await axios.get(`/api/clinics/reviews/${clinic._id}`);
        if (res.data.success) {
          setClinicReviews((prev) => ({
            ...prev,
            [clinic._id]: res.data.data,
          }));
        }
      } catch {
        setClinicReviews((prev) => ({
          ...prev,
          [clinic._id]: {
            averageRating: 0,
            totalReviews: 0,
            reviews: [],
          },
        }));
      } finally {
        setReviewsLoaded(true);
      }
    };
    fetchReviews();
  }, [clinic?._id]);

  // Navigate to enquiry or review form after successful login
  useEffect(() => {
    if (isAuthenticated && shouldNavigateAfterLogin.current && pendingClinicData.current) {
      shouldNavigateAfterLogin.current = false;
      const clinic = pendingClinicData.current.clinic;
      
      if (navigateToReview.current) {
        // Navigate to review form
        const params = new URLSearchParams({
          clinicId: clinic._id,
          clinicName: clinic.name,
        });
        router.push(`/clinic/review-form?${params.toString()}`);
        navigateToReview.current = false;
      } else {
        // Navigate to enquiry form
        const params = new URLSearchParams({
          clinicId: clinic._id,
          clinicName: clinic.name,
          clinicAddress: clinic.address,
        });
        router.push(`/clinic/enquiry-form?${params.toString()}`);
      }
      pendingClinicData.current = null;
    }
  }, [isAuthenticated, router]);

  // ✅ Handlers moved inside so they can use router + isAuthenticated
  const handleEnquiryClick = (clinic: Clinic) => {
    if (!isAuthenticated) {
      // Show login popup on the same page
      setAuthModalMode("login");
      setShowAuthModal(true);
      shouldNavigateAfterLogin.current = true;
      pendingClinicData.current = { clinic };
      return;
    }
    // If authenticated, navigate to enquiry form
    const params = new URLSearchParams({
      clinicId: clinic._id,
      clinicName: clinic.name,
      clinicAddress: clinic.address,
    });
    router.push(`/clinic/enquiry-form?${params.toString()}`);
  };

  const handleReviewClick = (clinic: Clinic) => {
    if (!isAuthenticated) {
      // Show login popup on the same page
      setAuthModalMode("login");
      setShowAuthModal(true);
      shouldNavigateAfterLogin.current = true;
      navigateToReview.current = true;
      pendingClinicData.current = { clinic };
      return;
    }
    // If authenticated, navigate to review form
    const params = new URLSearchParams({
      clinicId: clinic._id,
      clinicName: clinic.name,
    });
    router.push(`/clinic/review-form?${params.toString()}`);
  };

  const renderStars = (rating = 4.0) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star
          key="half"
          className="w-4 h-4 fill-yellow-400/50 text-yellow-400"
        />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }

    return stars;
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div
            className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: "#2D9AA5", borderTopColor: "transparent" }}
          ></div>
          <p className="text-lg font-medium" style={{ color: "#2D9AA5" }}>
            Loading Clinic
          </p>
        </div>
      </div>
    );
  if (error || !clinic)
    return (
      <div className="min-h-screen flex items-center justify-center">
        {error || "Not found"}
      </div>
    );

  const hasRating = clinicReviews[clinic._id]?.totalReviews > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-8">
        {/* Back Button */}
        <div className="flex justify-end">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-gray-600 hover:text-[#2D9AA5] transition-colors mb-6 group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back </span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Profile Header Section */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-[#2D9AA5]/5 to-[#2D9AA5]/10 border-b border-gray-100">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {(() => {
                const photosArray = clinic.photos || [];
                if (photosArray.length === 0) return null;

                const hasMultipleImages = photosArray.length > 1;
                // Ensure index is valid
                const safeIndex = currentImageIndex >= photosArray.length ? 0 : currentImageIndex;
                const currentSrc = normalizePhotoUrl(photosArray[safeIndex]);

                return (
                  <div className="w-full max-w-sm lg:max-w-xs flex-shrink-0">
                    <div className="relative w-full h-48 sm:h-56 lg:h-60 rounded-2xl overflow-hidden shadow-lg border-4 border-white bg-white group">
                      <Image
                        src={currentSrc}
                        alt={`${clinic.name} - Photo ${safeIndex + 1}`}
                        fill
                        className="object-contain transition-opacity duration-300"
                        sizes="(max-width: 1024px) 80vw, 320px"
                        priority
                      />

                      {/* Navigation Buttons */}
                      {hasMultipleImages && (
                        <>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentImageIndex((prev) => (prev - 1 + photosArray.length) % photosArray.length);
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-teal-800 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            aria-label="Previous image"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentImageIndex((prev) => (prev + 1) % photosArray.length);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-teal-800 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            aria-label="Next image"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>

                          {/* Dots Indicator */}
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">
                            {photosArray.map((_, idx) => (
                              <div
                                key={idx}
                                className={`w-1.5 h-1.5 rounded-full shadow-sm transition-all ${
                                  idx === safeIndex
                                    ? "bg-white scale-125"
                                    : "bg-white/50"
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                  {clinic.name}
                </h1>
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-[#2D9AA5]" />
                  <p className="text-gray-600 text-sm sm:text-base">
                    {clinic.address}
                  </p>
                </div>

                {/* Rating */}
                {clinic.listingVisibility?.showReviews !== false && (
                <div className="flex items-center gap-3 mb-6">
                  {hasRating ? (
                    <>
                      <div className="flex items-center gap-1 bg-[#2D9AA5]/10 rounded-full px-4 py-2">
                        <div className="flex">
                          {renderStars(clinicReviews[clinic._id].averageRating)}
                        </div>
                        <span className="text-sm font-semibold ml-1 text-[#2D9AA5]">
                          {clinicReviews[clinic._id].averageRating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        ({clinicReviews[clinic._id].totalReviews} reviews)
                      </span>
                    </>
                  ) : reviewsLoaded ? (
                    <span className="text-sm text-gray-500 bg-gray-100 rounded-full px-4 py-2">
                      No reviews yet
                    </span>
                  ) : null}
                </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons - Sticky Bar */}
          <div className="sticky top-0 z-20 bg-white border-b border-gray-100 p-4 sm:p-6">
            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
              {clinic.listingVisibility?.enableOnlineBooking !== false ? (
              <button
                onClick={() => handleEnquiryClick(clinic)}
                className="px-6 py-3 bg-gradient-to-r from-[#2D9AA5] to-[#2D9AA5]/90 text-white rounded-xl hover:from-[#2D9AA5]/90 hover:to-[#2D9AA5] transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Send Enquiry
              </button>
              ) : null}

              <button
                onClick={() => handleReviewClick(clinic)}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <Star className="w-4 h-4" />
                <span className="hidden sm:inline">Review</span>
              </button>

              {(() => {
                // Use address if available (more accurate), otherwise fall back to coordinates
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
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    <span className="hidden sm:inline">Directions</span>
                  </a>
                ) : null;
              })()}
            </div>
          </div>

          {/* Profile Information Grid */}
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {clinic.timings && (
                <div className="bg-gradient-to-br from-[#2D9AA5]/10 to-[#2D9AA5]/5 p-4 rounded-xl border border-[#2D9AA5]/20 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#2D9AA5]/20 rounded-lg">
                      <Clock className="w-5 h-5 text-[#2D9AA5]" />
                    </div>
                    <h3 className="font-bold text-gray-800">Operating Hours</h3>
                  </div>
                  <div className="text-gray-700 font-medium">{renderTimings(clinic.timings)}</div>
                </div>
              )}

              {clinic.pricing && clinic.listingVisibility?.showPrices !== false && (
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 rounded-xl border border-emerald-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-200 rounded-lg">
                      <span className="text-emerald-700 font-bold text-sm">
                        AED
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-800">
                      Consultation Fee
                    </h3>
                  </div>
                  <p className="text-gray-700 font-medium text-lg">
                    AED {clinic.pricing}
                  </p>
                </div>
              )}

              {/* Additional Info Card */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 rounded-xl border border-purple-200 hover:shadow-lg transition-all duration-300 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-200 rounded-lg">
                    <Award className="w-5 h-5 text-purple-700" />
                  </div>
                  <h3 className="font-bold text-gray-800">Quick Stats</h3>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Professional Healthcare</p>
                  <p>Licensed & Certified</p>
                </div>
              </div>
            </div>

            {/* Services Section */}
            {clinic.servicesName && clinic.servicesName.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-[#2D9AA5]/20 rounded-lg">
                    <Users className="w-6 h-6 text-[#2D9AA5]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Our Services
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {clinic.servicesName.map((service, idx) => (
                    <div
                      key={idx}
                      className="group bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-[#2D9AA5]/30 hover:shadow-md transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-[#2D9AA5] rounded-full group-hover:scale-110 transition-transform duration-300"></div>
                        <span className="font-medium text-gray-700 group-hover:text-[#2D9AA5] transition-colors duration-300">
                          {service}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Treatments Section - Updated to show sub-treatments */}
            {clinic.listingVisibility?.showServices !== false && clinic.treatments && clinic.treatments.filter((t: any) => t.enabled !== false).length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-[#2D9AA5]/20 rounded-lg">
                    <Calendar className="w-6 h-6 text-[#2D9AA5]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Specialized Treatments
                  </h3>
                </div>
                <div className="space-y-6">
                  {clinic.treatments.filter((t: any) => t.enabled !== false).map((treatment, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-[#2D9AA5]/30 transition-all duration-300"
                    >
                      {/* Main Treatment */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-3 h-3 bg-[#2D9AA5] rounded-full flex-shrink-0"></div>
                        <h4 className="text-lg font-bold text-gray-800">
                          {treatment.mainTreatment}
                        </h4>
                      </div>

                      {/* Sub Treatments */}
                      {treatment.subTreatments &&
                        treatment.subTreatments.filter((s) => s.enabled !== false).length > 0 && (
                          <div className="ml-6 space-y-3">
                            <p className="text-sm font-medium text-gray-600 mb-3">
                              Available Sub-treatments:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {treatment.subTreatments.filter((s) => s.enabled !== false).map(
                                (subTreatment, subIdx) => (
                                  <div
                                    key={subIdx}
                                    className="group flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-[#2D9AA5]/40 hover:bg-[#2D9AA5]/5 transition-all duration-200"
                                  >
                                    <ChevronRight className="w-4 h-4 text-[#2D9AA5]/60 group-hover:text-[#2D9AA5] transition-colors duration-200" />
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-[#2D9AA5] transition-colors duration-200">
                                      {subTreatment.name}
                                      {subTreatment.price !== undefined &&
                                        subTreatment.price > 0 && (
                                          <>
                                            {" "}
                                            -{" "}
                                            <span className="text-[#2D9AA5] font-semibold">
                                              د.إ{subTreatment.price}
                                            </span>
                                          </>
                                        )}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* If no sub-treatments (or all hidden), show description */}
                      {(!treatment.subTreatments ||
                        treatment.subTreatments.filter((s) => s.enabled !== false).length === 0) && (
                        <div className="ml-6">
                          <p className="text-sm text-gray-600">
                            Professional treatment with experienced specialists
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* About & Contact Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* About Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <div className="p-2 bg-[#2D9AA5]/20 rounded-lg">
                <Users className="w-6 h-6 text-[#2D9AA5]" />
              </div>
              About {clinic.name}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {clinic.name} is a trusted healthcare facility committed to providing exceptional medical care and personalized treatment plans. Our team of experienced professionals ensures the highest standards of patient care and medical excellence.
            </p>
            <div className="space-y-3">
              {clinic.timings && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#2D9AA5] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800">Operating Hours</p>
                    <div className="text-gray-600">{renderTimings(clinic.timings)}</div>
                  </div>
                </div>
              )}
              {clinic.pricing && clinic.listingVisibility?.showPrices !== false && (
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-[#2D9AA5] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800">Consultation Fee</p>
                    <p className="text-gray-600">AED {clinic.pricing}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact & Location Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <div className="p-2 bg-[#2D9AA5]/20 rounded-lg">
                <MapPin className="w-6 h-6 text-[#2D9AA5]" />
              </div>
              Location & Contact
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#2D9AA5] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800">Address</p>
                  <p className="text-gray-600">{clinic.address}</p>
                </div>
              </div>
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
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Navigation className="w-4 h-4" />
                    Get Directions
                  </a>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      {/* {clinic.location?.coordinates && clinic.location.coordinates.length === 2 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <div className="p-2 bg-[#2D9AA5]/20 rounded-lg">
                <MapPin className="w-6 h-6 text-[#2D9AA5]" />
              </div>
              Find Us on Map
            </h2>
            <div className="w-full h-96 rounded-xl overflow-hidden border border-gray-200">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dS6fa4U8xDGZQ&q=${clinic.location.coordinates[1]},${clinic.location.coordinates[0]}&zoom=15`}
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )} */}

      {/* Why Choose Us Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="p-2 bg-[#2D9AA5]/20 rounded-lg">
              <Sparkles className="w-6 h-6 text-[#2D9AA5]" />
            </div>
            Why Choose {clinic.name}?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 hover:shadow-lg transition-all">
              <div className="p-3 bg-[#2D9AA5] rounded-lg flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Verified & Certified</h3>
                <p className="text-sm text-gray-600">Fully licensed healthcare facility with certified medical professionals and verified credentials.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 hover:shadow-lg transition-all">
              <div className="p-3 bg-green-600 rounded-lg flex-shrink-0">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Patient-Centered Care</h3>
                <p className="text-sm text-gray-600">Personalized treatment plans tailored to each patient's unique healthcare needs and preferences.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 hover:shadow-lg transition-all">
              <div className="p-3 bg-purple-600 rounded-lg flex-shrink-0">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Expert Medical Team</h3>
                <p className="text-sm text-gray-600">Experienced healthcare professionals dedicated to providing the highest quality medical care.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 hover:shadow-lg transition-all">
              <div className="p-3 bg-amber-600 rounded-lg flex-shrink-0">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Convenient Timings</h3>
                <p className="text-sm text-gray-600">Flexible appointment scheduling to accommodate your busy lifestyle and urgent care needs.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/50 border border-teal-200 hover:shadow-lg transition-all">
              <div className="p-3 bg-teal-600 rounded-lg flex-shrink-0">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Transparent Pricing</h3>
                <p className="text-sm text-gray-600">Clear and upfront consultation fees with no hidden charges or surprise costs.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200 hover:shadow-lg transition-all">
              <div className="p-3 bg-indigo-600 rounded-lg flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Quality Assurance</h3>
                <p className="text-sm text-gray-600">Committed to maintaining the highest standards of medical excellence and patient satisfaction.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mission & Vision Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="p-2 bg-[#2D9AA5]/20 rounded-lg">
              <Users className="w-6 h-6 text-[#2D9AA5]" />
            </div>
            Our Mission & Vision
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 p-6 bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-xl border border-blue-200">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#2D9AA5]" />
                Our Mission
              </h3>
              <p className="text-gray-700 leading-relaxed">
                To provide accessible, high-quality healthcare services that improve the health and well-being of our community through compassionate care and medical excellence.
              </p>
            </div>
            <div className="space-y-3 p-6 bg-gradient-to-br from-green-50 to-green-100/30 rounded-xl border border-green-200">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#2D9AA5]" />
                Our Vision
              </h3>
              <p className="text-gray-700 leading-relaxed">
                To be recognized as a leading healthcare provider known for innovation, patient-centered care, and unwavering commitment to medical excellence.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Facilities & Amenities Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="p-2 bg-[#2D9AA5]/20 rounded-lg">
              <Building2 className="w-6 h-6 text-[#2D9AA5]" />
            </div>
            Facilities & Amenities
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              "Modern Equipment",
              "Clean & Sanitized",
              "Parking Available",
              "Wheelchair Accessible",
              "Air Conditioned",
              "Wi-Fi Available",
              "Emergency Services",
              "Pharmacy Nearby"
            ].map((facility, idx) => (
              <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-[#2D9AA5]/5 transition-all">
                <CheckCircle className="w-4 h-4 text-[#2D9AA5] flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700">{facility}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed About Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="p-2 bg-[#2D9AA5]/20 rounded-lg">
              <Users className="w-6 h-6 text-[#2D9AA5]" />
            </div>
            About Our Clinic
          </h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed mb-4 text-base">
              {clinic.name} stands as a beacon of excellence in healthcare, dedicated to providing comprehensive medical services with a focus on patient well-being and satisfaction. Our clinic combines traditional medical practices with modern technology to deliver exceptional healthcare experiences.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4 text-base">
              With a team of highly qualified and experienced medical professionals, we ensure that every patient receives personalized attention and care tailored to their specific health needs. Our commitment to excellence is reflected in our state-of-the-art facilities, advanced medical equipment, and compassionate approach to patient care.
            </p>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            shouldNavigateAfterLogin.current = false;
            navigateToReview.current = false;
            pendingClinicData.current = null;
          }}
          onSuccess={() => {
            setShowAuthModal(false);
            // Navigation will happen automatically via useEffect when isAuthenticated becomes true
          }}
          initialMode={authModalMode}
        />
      )}
    </div>
  );
}
