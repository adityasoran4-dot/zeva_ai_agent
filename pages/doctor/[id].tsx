
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { Calendar, X, Star, Navigation } from "lucide-react";
import dayjs from "dayjs";
import CalculatorGames from "../../components/CalculatorGames";
import { useAuth } from "../../context/AuthContext";
import AuthModal from "../../components/AuthModal";
import toast, { Toaster } from "react-hot-toast";
import { normalizeImagePath } from "../../lib/utils";

interface DoctorProfile {
  _id: string;
  user: { name: string; email?: string; phone?: string };
  degree?: string;
  address?: string;
  photos?: string[];
  treatments?: Array<{
    mainTreatment: string;
    subTreatments?: Array<{ name: string }>;
  }>;
  experience?: number;
  consultationFee?: number;
  clinicContact?: string;
  location?: { coordinates?: [number, number] };
  timeSlots?: Array<{
    date: string;
    availableSlots: number;
    sessions: { morning: string[]; evening: string[] };
  }>;
}

interface ReviewData {
  averageRating: number;
  totalReviews: number;
  reviews: Array<{
    comment: string;
    userId: { name: string };
  }>;
}

export default function DoctorDetail() {
  const router = useRouter();
  // 'id' from path will be the slug (doctor name)
  const slug = router.query.id as string | undefined;
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">(
    "login"
  );
  const [pendingAction, setPendingAction] = useState<null | {
    type: "enquiry" | "review" | "prescription";
  }>(null);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  // const [showReviews, setShowReviews] = useState(false);
  const [modalReview, setModalReview] = useState<string | null>(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState({
    healthIssue: "",
    symptoms: "",
  });
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  useEffect(() => {
    if (!router.isReady || !slug) return;
    
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if slug is an ObjectId (for backward compatibility)
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
        
        let res;
        if (isObjectId) {
          // Old ObjectId-based URL - fetch by ObjectId first
          try {
            res = await axios.get(`/api/doctor/profile/${slug}`);
            const profile = res.data?.profile;
            
            // If doctor has a slug, redirect to slug-based URL
            if (profile?.slug && profile?.slugLocked) {
              router.replace(`/doctor/${profile.slug}`, undefined, { shallow: false });
              return;
            }
          } catch (err: any) {
            // If fetch fails, try redirect API
            try {
              // Redirect API will handle slug generation if needed
              window.location.href = `/api/doctors/redirect/${slug}`;
              return;
            } catch (redirectErr) {
              throw err;
            }
          }
        } else {
          // New slug-based URL - fetch by slug
          res = await axios.get(`/api/doctors/by-slug/${slug}`);
        }
        
        setProfile(res.data?.profile ?? null);
      } catch (err: any) {
        console.error("Error fetching doctor:", err);
        setError(err.response?.data?.message || "Failed to load doctor");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [slug, router.isReady, router]);

  useEffect(() => {
    if (!profile?._id) return;
    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await axios.get<{ success: boolean; data: ReviewData }>(
          `/api/doctor/reviews/${profile._id}`
        );
        if (res.data?.success) {
          setReviewData(res.data.data);
        } else {
          setReviewData({ averageRating: 0, totalReviews: 0, reviews: [] });
        }
      } catch {
        setReviewData({ averageRating: 0, totalReviews: 0, reviews: [] });
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [profile?._id]);

  const renderStars = (rating: number) => {
    const stars: React.ReactElement[] = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star
          key={`full-${i}`}
          className="w-4 h-4 fill-yellow-400 text-yellow-400"
        />
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

  const handleReviewClick = () => {
    if (!profile) return;
    if (!isAuthenticated) {
      setPendingAction({ type: "review" });
      setAuthModalMode("login");
      setShowAuthModal(true);
      return;
    }
    const params = new URLSearchParams({
      doctorId: profile._id,
      doctorName: profile.user.name,
    });
    router.push(`/doctor/review-form?${params.toString()}`);
  };

  const handlePrescriptionRequest = () => {
    if (!profile) return;
    if (!isAuthenticated) {
      setPendingAction({ type: "prescription" });
      setAuthModalMode("login");
      setShowAuthModal(true);
      return;
    }
    setShowPrescriptionModal(true);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (!profile || !pendingAction) return;
    if (pendingAction.type === "enquiry") {
      const params = new URLSearchParams({
        doctorId: profile._id,
        doctorName: profile.user.name,
        specialization: profile.degree || "",
      });
      router.push(`/doctor/enquiry-form?${params.toString()}`);
    } else if (pendingAction.type === "review") {
      const params = new URLSearchParams({
        doctorId: profile._id,
        doctorName: profile.user.name,
      });
      router.push(`/doctor/review-form?${params.toString()}`);
    } else if (pendingAction.type === "prescription") {
      setShowPrescriptionModal(true);
    }
    setPendingAction(null);
  };

 const handlePrescriptionSubmit = async () => {
  if (!prescriptionForm.healthIssue.trim()) {
    toast.error("Please describe your health issue", {
      style: { background: "#2D9AA5", color: "#fff" },
    });
    return;
  }

  setPrescriptionLoading(true);

  try {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/prescription/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({
        doctorId: profile?._id || (router.query.id as string),
        healthIssue: prescriptionForm.healthIssue,
        symptoms: prescriptionForm.symptoms,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      toast.success("Prescription request sent successfully!", {
        style: { background: "#2D9AA5", color: "#fff" },
      });
      setShowPrescriptionModal(false);
      setPrescriptionForm({ healthIssue: "", symptoms: "" });
    } else {
      toast.error(data.message || "Failed to send prescription request", {
        style: { background: "#2D9AA5", color: "#fff" },
      });
    }
  } catch {
    // For fetch, error is usually a network error
    toast.error("Failed to send prescription request", {
      style: { background: "#2D9AA5", color: "#fff" },
    });
  } finally {
    setPrescriptionLoading(false);
  }
};


  const handleAuthModalClose = () => {
    setShowAuthModal(false);
    setPendingAction(null);
  };

  const capitalizeMonth = (dateStr: string) =>
    dateStr.replace(/\b([a-z])/g, (match, p1, offset) => {
      if (offset > 0 && dateStr[offset - 1] === " ") return p1.toUpperCase();
      return match;
    });

  const isTodayOrFuture = (dateStr: string) => {
    const parsed = dayjs(
      capitalizeMonth(dateStr) + " " + dayjs().year(),
      "DD MMMM YYYY"
    );
    const today = dayjs().startOf("day");
    return (
      parsed.isValid() &&
      (parsed.isSame(today, "day") || parsed.isAfter(today, "day"))
    );
  };

  const futureSlots = (profile?.timeSlots || []).filter((ts) =>
    isTodayOrFuture(ts.date)
  );

  useEffect(() => {
    if (modalReview) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalReview]);

  useEffect(() => {
    if (showPrescriptionModal) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden"; // lock html too
    } else {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    };
  }, [showPrescriptionModal]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div
            className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: "#2D9AA5", borderTopColor: "transparent" }}
          ></div>
          <p className="text-lg font-medium" style={{ color: "#2D9AA5" }}>
            Loading Profile
          </p>
        </div>
      </div>
    );
  if (error || !profile)
    return (
      <div className="min-h-screen flex items-center justify-center">
        {error || "Not found"}
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <Toaster position="top-center" reverseOrder={false} />
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleAuthModalClose}
        onSuccess={handleAuthSuccess}
        initialMode={authModalMode}
      />

      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header Section with Circular Photo and Info */}
        <div className="bg-gray-50 px-6 py-8 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Profile Photo - Circular */}
            <div className="flex justify-center lg:justify-start">
              {profile.photos?.[0] ? (
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                  <img
                    src={normalizeImagePath(profile.photos[0])}
                    alt={profile.user?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-lg">No Photo</span>
                </div>
              )}
            </div>

            {/* Doctor Info */}
            <div className="flex-1 text-center lg:text-left text-gray-800">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                {profile.user?.name}
              </h1>
              {profile.degree && (
                <p className="text-xl font-medium text-[#2D9AA5] mb-3">
                  {profile.degree}
                </p>
              )}
              {profile.address && (
                <p className="text-gray-600 mb-3">{profile.address}</p>
              )}

              {/* Rating */}
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                {reviewsLoading ? (
                  <span className="text-gray-600">Loading rating...</span>
                ) : reviewData && reviewData.totalReviews > 0 ? (
                  <>
                    <div className="flex items-center">
                      {renderStars(reviewData.averageRating)}
                    </div>
                    <span className="font-medium text-gray-800">
                      {reviewData.averageRating.toFixed(1)}
                    </span>
                    <span className="text-gray-600">
                      ({reviewData.totalReviews} reviews)
                    </span>
                  </>
                ) : (
                  <span className="text-gray-600">No reviews yet</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                {futureSlots.length > 0 && (
                  <button
                    onClick={() => setShowCalendarModal(true)}
                    className="inline-flex items-center justify-center px-6 py-3 bg-[#2D9AA5] hover:bg-[#2D9AA5]/90 text-white rounded-lg transition-all font-medium shadow-md"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    View Slots
                  </button>
                )}
                <button
                  onClick={handleReviewClick}
                  className="inline-flex items-center justify-center px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-all font-medium shadow-md"
                >
                  Write a Review
                </button>
                <button
                  onClick={handlePrescriptionRequest}
                  className="inline-flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-medium shadow-md"
                >
                  Request Prescription
                </button>

                {/* Directions Button */}
                {(() => {
                  // Use address if available (more accurate), otherwise fall back to coordinates
                  const mapsHref = profile.address
                    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(profile.address)}`
                    : profile.location?.coordinates?.length === 2
                    ? `https://www.google.com/maps/dir/?api=1&destination=${profile.location.coordinates[1]},${profile.location.coordinates[0]}`
                    : null;
                  return mapsHref ? (
                    <a
                      href={mapsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all font-medium shadow-md"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Directions
                    </a>
                  ) : null;
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Doctor Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Experience, Fee, Contact Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {typeof profile.experience === "number" && (
                  <div className="p-4 bg-gradient-to-br from-[#2D9AA5]/10 to-[#2D9AA5]/5 rounded-lg border border-[#2D9AA5]/20">
                    <h3 className="font-semibold text-gray-800 mb-1">
                      Experience
                    </h3>
                    <p className="text-gray-700 text-lg font-medium">
                      {profile.experience} years
                    </p>
                  </div>
                )}
                {typeof profile.consultationFee === "number" && (
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-25 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-gray-800 mb-1">
                      Consultation Fee
                    </h3>
                    <p className="text-gray-700 text-lg font-medium">
                      AED {profile.consultationFee}
                    </p>
                  </div>
                )}
                {profile.clinicContact && (
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-25 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-gray-800 mb-1">
                      Contact
                    </h3>
                    <a
                      href={`tel:${profile.clinicContact}`}
                      className="text-blue-600 hover:underline text-lg font-medium"
                    >
                      {profile.clinicContact}
                    </a>
                  </div>
                )}
              </div>

              {/* Treatments Section */}
              {profile.treatments && profile.treatments.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-4 text-xl">
                    Treatments & Services
                  </h3>
                  <div className="space-y-4">
                    {profile.treatments.map((t, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-gradient-to-br from-purple-50 to-purple-25 border border-purple-200 rounded-lg"
                      >
                        <div className="mb-3">
                          <span className="px-4 py-2 rounded-full bg-purple-600 text-white text-sm font-medium inline-block">
                            {t.mainTreatment}
                          </span>
                        </div>
                        {t.subTreatments && t.subTreatments.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {t.subTreatments.map((s, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 rounded-full bg-white text-purple-700 text-xs border border-purple-300 shadow-sm"
                              >
                                {s.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Slots Section */}
              {futureSlots.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-4 text-xl">
                    Available Appointments
                  </h3>
                  <div className="space-y-4">
                    {futureSlots.map((slot, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-white"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900 text-lg">
                            {slot.date}
                          </h4>
                          <span className="text-sm font-medium text-[#2D9AA5] bg-[#2D9AA5]/10 px-3 py-1 rounded-full border border-[#2D9AA5]/20">
                            {slot.availableSlots} slots available
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {slot.sessions?.morning?.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">
                                Morning Sessions
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {slot.sessions.morning.map((t, i) => (
                                  <button
                                    key={i}
                                    className="px-3 py-2 bg-white text-gray-800 rounded-lg text-sm border border-gray-200 hover:border-[#2D9AA5] hover:text-[#2D9AA5] transition shadow-sm"
                                  >
                                    {t}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {slot.sessions?.evening?.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">
                                Evening Sessions
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {slot.sessions.evening.map((t, i) => (
                                  <button
                                    key={i}
                                    className="px-3 py-2 bg-white text-gray-800 rounded-lg text-sm border border-gray-200 hover:border-[#2D9AA5] hover:text-[#2D9AA5] transition shadow-sm"
                                  >
                                    {t}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Section - moved below slots */}
              <div className="mt-8">
                <h3 className="font-semibold text-gray-800 text-xl mb-4">
                  Recent Reviews
                </h3>
                {reviewsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D9AA5] mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading reviews...</p>
                  </div>
                ) : reviewData && reviewData.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviewData.reviews.slice(0, 6).map((r, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-[#2D9AA5] rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {r.userId.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            {(() => {
                              const comment = r.comment ?? ""; // fallback if comment is null/undefined
                              const lines = comment.split(/\r?\n/);
                              const isLong = lines.length > 7;
                              const displayText = isLong
                                ? lines.slice(0, 7).join("\n")
                                : comment;
                              return (
                                <>
                                  <p
                                    className="text-sm text-gray-800 mb-2 leading-relaxed"
                                    style={{
                                      wordBreak: "break-word",
                                      overflowWrap: "break-word",
                                      whiteSpace: "pre-line",
                                      display: "-webkit-box",
                                      WebkitLineClamp: isLong ? 7 : "unset",
                                      WebkitBoxOrient: "vertical",
                                      overflow: isLong ? "hidden" : "visible",
                                    }}
                                  >
                                    {displayText}
                                  </p>
                                  {isLong && (
                                    <button
                                      className="text-xs text-[#2D9AA5] underline cursor-pointer mb-2"
                                      onClick={() => setModalReview(r.comment)}
                                    >
                                      Read More
                                    </button>
                                  )}
                                  <p className="text-xs text-gray-500 font-medium">
                                    - {r.userId.name}
                                  </p>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-gray-400 text-2xl">💬</span>
                    </div>
                    <p className="text-gray-500">No reviews yet</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Be the first to leave a review!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Reviews */}
            {/* REMOVE the entire right column review section (lines 360-414) */}
          </div>
        </div>
      </div>

      {/* Appointment Modal */}
      {showCalendarModal && futureSlots.length > 0 && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
            <div className="sticky top-0 bg-gradient-to-r from-[#2D9AA5] to-[#2D9AA5]/90 text-white p-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Available Appointments</h3>
              <button
                onClick={() => setShowCalendarModal(false)}
                className="p-2 hover:bg-white/20 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="space-y-6">
                {futureSlots.map((slot, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900 text-lg">
                        {slot.date}
                      </h4>
                      <span className="text-sm font-medium text-[#2D9AA5] bg-[#2D9AA5]/10 px-4 py-2 rounded-full border border-[#2D9AA5]/20">
                        {slot.availableSlots} slots available
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {slot.sessions?.morning?.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                            <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                            Morning Sessions
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {slot.sessions.morning.map((t, i) => (
                              <button
                                key={i}
                                className="px-4 py-2 bg-white text-gray-800 rounded-lg text-sm border border-gray-200 hover:border-[#2D9AA5] hover:text-[#2D9AA5] hover:bg-[#2D9AA5]/5 transition shadow-sm"
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {slot.sessions?.evening?.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                            <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                            Evening Sessions
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {slot.sessions.evening.map((t, i) => (
                              <button
                                key={i}
                                className="px-4 py-2 bg-white text-gray-800 rounded-lg text-sm border border-gray-200 hover:border-[#2D9AA5] hover:text-[#2D9AA5] hover:bg-[#2D9AA5]/5 transition shadow-sm"
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200/50 flex flex-col transform animate-slideUp">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#2D9AA5] via-[#2D9AA5] to-[#1e6b73] text-white p-6 flex items-center justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-20"></div>
              <div className="relative z-10 flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2ZM11 6C11 5.44772 10.5523 5 10 5C9.44772 5 9 5.44772 9 6V9H6C5.44772 9 5 9.44772 5 10C5 10.5523 5.44772 11 6 11H9V14C9 14.5523 9.44772 15 10 15C10.5523 15 11 14.5523 11 14V11H14C14.5523 11 15 10.5523 15 10C15 9.44772 14.5523 9 14 9H11V6Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    Request Prescription
                  </h3>
                  <p className="text-white/80 text-sm">
                    Get medical assistance from our professionals
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPrescriptionModal(false)}
                className="relative z-10 p-2.5 hover:bg-white/20 rounded-full transition-all duration-200 group"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-hidden flex-1">
              <div className="space-y-6">
                {/* Health Issue Section */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-[#2D9AA5] rounded-full"></div>
                    <label className="block text-sm font-semibold text-gray-900">
                      Health Issue
                    </label>
                    <span className="text-red-500 text-sm">*</span>
                  </div>
                  <div className="relative">
                    <textarea
                      value={prescriptionForm.healthIssue}
                      onChange={(e) =>
                        setPrescriptionForm((prev) => ({
                          ...prev,
                          healthIssue: e.target.value,
                        }))
                      }
                      placeholder="Please describe your health concern in detail. Include when it started, severity, and any relevant medical history..."
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-all duration-200 resize-none text-gray-900 placeholder-gray-500 bg-gray-50/30 hover:bg-white hover:border-gray-300"
                      rows={4}
                      required
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                      {prescriptionForm.healthIssue.length}/500
                    </div>
                  </div>
                </div>

                {/* Symptoms Section */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <label className="block text-sm font-semibold text-gray-900">
                      Symptoms
                    </label>
                    <span className="text-gray-400 text-sm">(Optional)</span>
                  </div>
                  <div className="relative">
                    <textarea
                      value={prescriptionForm.symptoms}
                      onChange={(e) =>
                        setPrescriptionForm((prev) => ({
                          ...prev,
                          symptoms: e.target.value,
                        }))
                      }
                      placeholder="List any symptoms you're experiencing (e.g., pain level, duration, frequency, triggers)..."
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-all duration-200 resize-none text-gray-900 placeholder-gray-500 bg-gray-50/30 hover:bg-white hover:border-gray-300"
                      rows={3}
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                      {prescriptionForm.symptoms.length}/300
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50/80 backdrop-blur-sm border-t border-gray-200 p-6">
              <div className="flex gap-3">
                <button
                  onClick={handlePrescriptionSubmit}
                  disabled={prescriptionLoading}
                  className="flex-1 bg-gradient-to-r from-[#2D9AA5] to-[#1e6b73] hover:from-[#1e6b73] hover:to-[#2D9AA5] disabled:from-gray-400 disabled:to-gray-400 text-white py-3.5 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center space-x-2 group"
                >
                  {prescriptionLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      <span>Sending Request...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Request</span>
                      <svg
                        className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowPrescriptionModal(false)}
                  className="px-6 py-3.5 border-2 border-gray-300 text-gray-900 rounded-xl hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CalculatorGames />

      {/* Modal for full review */}
      {modalReview && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setModalReview(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-gray-800 whitespace-pre-line break-words">
              {modalReview}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
