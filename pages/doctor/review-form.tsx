"use client";

import React, { useState } from "react";
import { useRouter } from "next/router";
import {
  Star,
  MessageSquare,
  User,
  ArrowLeft,
  Send,
  CheckCircle,
  Heart,
} from "lucide-react";

function DoctorReviewForm() {
  const router = useRouter();
  const { doctorId, doctorName } = router.query as {
    doctorId?: string;
    doctorName?: string;
  };

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showEmojiAnimation, setShowEmojiAnimation] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      if (!token) {
        setError("Authentication required. Please log in.");
        return;
      }

      const response = await fetch("/api/doctor/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctorId,
          rating,
          comment: comment.trim(),
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.back();
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to submit review");
      }
    } catch (err) {
      console.error("Review submission error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getRatingEmoji = (rating: number): string => {
    const emojis: { [key: number]: string } = {
      1: "😞",
      2: "😐",
      3: "🙂",
      4: "😊",
      5: "🤩",
    };
    return emojis[rating] || "";
  };

  const getRatingText = (rating: number): string => {
    const texts: { [key: number]: string } = {
      1: "Poor",
      2: "Fair",
      3: "Good",
      4: "Very Good",
      5: "Excellent",
    };
    return texts[rating] || "";
  };

  const getRatingColor = (rating: number): string => {
    const colors: { [key: number]: string } = {
      1: "text-red-500",
      2: "text-orange-500",
      3: "text-yellow-500",
      4: "text-green-500",
      5: "text-emerald-500",
    };
    return colors[rating] || "text-gray-500";
  };

  const handleStarClick = (starValue: number) => {
    setRating(starValue);
    setShowEmojiAnimation(true);
    setTimeout(() => setShowEmojiAnimation(false), 600);
  };

  const renderStars = (): React.ReactNode[] => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isActive = starValue <= (hoverRating || rating);

      return (
        <button
          key={index}
          type="button"
          className={`relative w-10 h-10 transition-all duration-300 transform hover:scale-125 ${
            isActive
              ? "text-yellow-400 drop-shadow-lg"
              : "text-gray-300 hover:text-yellow-200"
          }`}
          onClick={() => handleStarClick(starValue)}
          onMouseEnter={() => setHoverRating(starValue)}
          onMouseLeave={() => setHoverRating(0)}
        >
          <Star
            className={`w-full h-full fill-current transition-all duration-300 ${
              isActive ? "animate-pulse" : ""
            }`}
          />
          {isActive && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
          )}
        </button>
      );
    });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-100 rounded-full translate-y-12 -translate-x-12 opacity-30"></div>

            <div className="relative z-10">
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Review Submitted!
              </h2>
              <p className="text-gray-600 mb-6 text-lg">
                Thank you for your feedback. Your review has been successfully
                submitted.
              </p>
              <div className="text-sm text-gray-500">Redirecting you back...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-2 sm:p-4 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 sm:mb-6 transition-all duration-200 hover:translate-x-1 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            Back
          </button>

          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                background: "linear-gradient(to right, #2D9AA5, #228B8D)",
              }}
            >
              <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Write a Review
              </h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-base sm:text-lg">
                Share your experience with Dr. {doctorName}
              </p>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
          {/* Subtle background pattern */}
          <div
            className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 rounded-full -translate-y-16 sm:-translate-y-20 translate-x-16 sm:translate-x-20 opacity-50"
            style={{
              background: "linear-gradient(to bottom right, #F0FDFA, #CCFBF1)",
            }}
          ></div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 sm:space-y-8 relative z-10"
          >
            {/* Doctor Info */}
            <div
              className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-xl border border-gray-100"
              style={{
                background: "linear-gradient(to right, #F7FFFE, #ECFDF5)",
              }}
            >
              <div
                className="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-md"
                style={{
                  background: "linear-gradient(to right, #CCFBF1, #A7F3D0)",
                }}
              >
                <User
                  className="w-5 h-5 sm:w-7 sm:h-7"
                  style={{ color: "#2D9AA5" }}
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base sm:text-lg">
                  Dr. {doctorName}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Healthcare Provider
                </p>
              </div>
            </div>

            {/* Rating Section */}
            <div className="text-center bg-gray-50 rounded-xl p-4 sm:p-6 lg:p-8">
              <label className="block text-base sm:text-lg font-medium text-gray-700 mb-4 sm:mb-6">
                Rate your experience
              </label>

              <div className="flex justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                {renderStars()}
              </div>

              {/* Emoji and Rating Display */}
              <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                {(hoverRating || rating) > 0 && (
                  <>
                    <div
                      className={`text-2xl sm:text-3xl transition-all duration-300 ${
                        showEmojiAnimation ? "animate-bounce scale-125" : ""
                      }`}
                    >
                      {getRatingEmoji(hoverRating || rating)}
                    </div>
                    <div className="text-center">
                      <p
                        className={`text-xl sm:text-2xl font-bold transition-colors duration-300 ${getRatingColor(
                          hoverRating || rating
                        )}`}
                      >
                        {getRatingText(hoverRating || rating)}
                      </p>
                      <p className="text-gray-600 text-base sm:text-lg">
                        ({hoverRating || rating}/5)
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Rating feedback text */}
              {rating > 0 && (
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-white rounded-lg border border-gray-200">
                  <p className="text-xs sm:text-sm text-gray-600">
                    {rating <= 2 &&
                      "We're sorry to hear about your experience. Your feedback helps us improve."}
                    {rating === 3 &&
                      "Thank you for your feedback. We appreciate your honest review."}
                    {rating >= 4 &&
                      "We're delighted to hear about your positive experience!"}
                  </p>
                </div>
              )}
            </div>

            {/* Comment Section */}
            <div>
              <label className="block text-base sm:text-lg font-medium text-gray-700 mb-3 sm:mb-4">
                Share your thoughts (optional)
              </label>
              <div className="relative">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="text-gray-700 w-full p-3 sm:p-4 border-2 border-gray-200 rounded-xl resize-none transition-all duration-200 hover:border-gray-300 placeholder-gray-400 text-sm sm:text-base focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-200"
                  onBlur={(e) => {
                    e.target.style.borderColor = "#E5E7EB";
                    e.target.style.boxShadow = "none";
                  }}
                  placeholder="Tell us about your experience with this doctor..."
                  maxLength={500}
                />
                <div className="absolute bottom-3 right-3">
                  <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3 gap-1 sm:gap-0">
                <span>
                  Your feedback helps other patients make informed decisions
                </span>
                <span
                  className={`font-medium ${
                    comment.length > 450 ? "text-orange-500" : ""
                  }`}
                >
                  {comment.length}/500
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 sm:p-4 animate-pulse">
                <p className="text-red-600 font-medium text-sm sm:text-base">
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 sm:gap-3 shadow-lg text-sm sm:text-base ${
                loading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "text-white hover:shadow-xl"
              }`}
              style={
                !loading
                  ? {
                      background: "linear-gradient(to right, #2D9AA5, #228B8D)",
                    }
                  : {}
              }
              onMouseEnter={(e) => {
                if (!loading) {
                  (e.target as HTMLButtonElement).style.background =
                    "linear-gradient(to right, #236B73, #1A6B6B)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  (e.target as HTMLButtonElement).style.background =
                    "linear-gradient(to right, #2D9AA5, #228B8D)";
                }
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Submit Review</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

DoctorReviewForm.getLayout = function PageLayout(page: React.ReactNode) {
  return page;
};

export default DoctorReviewForm;
