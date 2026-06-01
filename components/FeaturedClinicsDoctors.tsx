import React, { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import axios from "axios";
import { ChevronRight, ChevronLeft, MapPin, Shield, Sparkles, Stethoscope, Building2 } from "lucide-react";
import TelemedicinePromoSection from "./TelemedicinePromoSection";
import { normalizeImagePath } from "../lib/utils";

type ProviderCard = {
  type: "clinic" | "doctor";
  _id: string;
  name: string;
  address: string;
  image: string;
  photos?: string[];
  startingFrom: string;
  averageRating: number;
  totalReviews: number;
  tags: string[];
  __isPremium?: boolean;
  slug?: string | null;
  slugLocked?: boolean;
};

type ApiResponse = {
  success: boolean;
  data: {
    clinics: ProviderCard[];
    doctors: ProviderCard[];
    pagination?: {
      page: number;
      pageSize: number;
      clinicsHasNext: boolean;
      doctorsHasNext: boolean;
    };
  };
};

const slugify = (s: string) =>
  (s || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const ProviderHref = (p: ProviderCard) => {
  if (p.type === "clinic") {
    const slug = slugify(p.name);
    return `/clinics/${slug}?c=${p._id}`;
  } else {
    // For doctors, use the same logic as doctor/search page
    // If slug exists and is locked, use slug-based URL, otherwise use _id
    if (p.slug && p.slugLocked) {
      return `/doctor/${p.slug}`;
    } else {
      return `/doctor/${p._id}`;
    }
  }
};

const DEFAULT_IMG = "/image1.png";

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition ${
      active
        ? "bg-teal-800 text-white"
        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
    }`}
  >
    {children}
  </button>
);

const Card: React.FC<{ p: ProviderCard }> = ({ p }) => {
  const [imgIndex, setImgIndex] = useState(0);

  const badge = p.__isPremium
    ? "Premium"
    : p.averageRating >= 4.8
    ? "Top Rated"
    : "Most Booked";

  const gallery = useMemo(() => {
    if (p.photos && p.photos.length > 0) return p.photos;
    return [p.image];
  }, [p.photos, p.image]);

  const hasMultipleImages = gallery.length > 1;
  const currentSrc = normalizeImagePath(gallery[imgIndex]) || DEFAULT_IMG;

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((prev) => (prev + 1) % gallery.length);
  };

  return (
    <Link href={ProviderHref(p)} className="group">
      <div className="bg-white rounded-2xl border overflow-hidden hover:shadow-xl transition h-full flex flex-col">
        <div className="relative bg-gray-100 overflow-hidden" style={{ aspectRatio: '4/3' }}>
          <img
            src={currentSrc}
            alt={p.name}
            className="w-full h-full object-cover transition-opacity duration-300"
            style={{
              objectFit: 'cover',
              width: '100%',
              height: '100%',
              display: 'block'
            }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = DEFAULT_IMG;
            }}
          />

          {/* Navigation Buttons */}
          {hasMultipleImages && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-teal-800 p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-teal-800 p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              {/* Dots Indicator */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {gallery.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`w-1.5 h-1.5 rounded-full shadow-sm transition-colors ${idx === imgIndex ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}

          <span className="absolute top-3 left-3 bg-amber-300 px-3 py-1 rounded-full text-xs font-semibold z-10">
            {badge}
          </span>

          <span className="absolute top-3 right-3 w-8 h-8 bg-teal-800 text-white rounded-full flex items-center justify-center z-10">
            <Shield className="w-4 h-4" />
          </span>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <div className="flex justify-between gap-2">
            <div className="font-semibold text-gray-900 line-clamp-2">
              {p.name}
            </div>
            <div className="text-amber-500 text-sm font-semibold">
              ★ {p.averageRating.toFixed(1)}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {p.tags?.slice(0, 2).map((t) => (
              <span
                key={t}
                className="text-xs px-2 py-1 bg-teal-50 text-teal-800 rounded-full"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-teal-800" />
            <span className="truncate">{p.address}</span>
          </div>

          <div className="mt-auto pt-3  flex justify-between items-center">
            <div>
              <div className="text-xs text-gray-500">Starting from</div>
              <div className="font-semibold text-blue-700">
                {p.startingFrom || "AED —"}
              </div>
            </div>
            <div className="bg-amber-300 px-4 py-2 rounded-xl text-sm font-medium">
              View Details
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

// Reusable Carousel Component
const Carousel: React.FC<{
  items: ProviderCard[];
  loading: boolean;
}> = ({ items, loading }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const CARDS_PER_VIEW = 4;

  const totalPages = Math.ceil(items.length / CARDS_PER_VIEW);
  const showNavigation = items.length > CARDS_PER_VIEW;
  const canGoNext = currentPage < totalPages - 1;
  const canGoPrevious = currentPage > 0;

  const handleNext = () => {
    if (canGoNext) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (canGoPrevious) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  // Reset to first page when items change
  useEffect(() => {
    setCurrentPage(0);
  }, [items.length]);

  return (
    <div className="relative">
      {/* Carousel Container */}
      <div className="overflow-hidden w-full">
        <div
          ref={carouselRef}
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${currentPage * 100}%)`,
          }}
        >
          {Array.from({ length: totalPages }).map((_, pageIndex) => {
            const pageItems = items.slice(
              pageIndex * CARDS_PER_VIEW,
              (pageIndex + 1) * CARDS_PER_VIEW
            );

            return (
              <div
                key={`page-${pageIndex}`}
                className="flex-shrink-0 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {pageItems.map((p) => (
                  <Card key={p._id} p={p} />
                ))}
                {/* Fill remaining slots with empty divs to maintain grid layout */}
                {pageItems.length < CARDS_PER_VIEW &&
                  Array.from({ length: CARDS_PER_VIEW - pageItems.length }).map(
                    (_, idx) => <div key={`empty-${idx}`} />
                  )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Arrows - Only visible when cards > 4 */}
      {showNavigation && (
        <div className="flex justify-end items-center gap-3 mt-6">
          <button
            type="button"
            disabled={!canGoPrevious || loading}
            onClick={handlePrevious}
            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
              !canGoPrevious || loading
                ? "text-gray-300 border-gray-200 cursor-not-allowed bg-gray-50 pointer-events-none"
                : "text-teal-800 border-teal-300 hover:bg-teal-50 hover:border-teal-400 cursor-pointer active:scale-95 shadow-sm hover:shadow-md bg-white"
            }`}
            aria-label="Previous 4 cards"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            disabled={!canGoNext || loading}
            onClick={handleNext}
            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
              !canGoNext || loading
                ? "text-gray-300 border-gray-200 cursor-not-allowed bg-gray-50 pointer-events-none"
                : "text-teal-800 border-teal-300 hover:bg-teal-50 hover:border-teal-400 cursor-pointer active:scale-95 shadow-sm hover:shadow-md bg-white"
            }`}
            aria-label="Next 4 cards"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};

const FeaturedClinicsDoctors: React.FC = () => {
  const [tab, setTab] = useState<"all" | "clinics" | "doctors">("all");
  const [loading, setLoading] = useState(false);
  const [clinics, setClinics] = useState<ProviderCard[]>([]);
  const [doctors, setDoctors] = useState<ProviderCard[]>([]);
  const CARDS_PER_VIEW = 4;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get<ApiResponse>("/api/featured/providers", {
        params: { tab, page: 1, pageSize: 20 },
      });

      if (res.data.success) {
        setClinics(res.data.data.clinics || []);
        setDoctors(res.data.data.doctors || []);
      }
    } catch (error) {
      console.error('Error fetching featured providers:', error);
      // Set empty arrays to prevent the component from breaking
      setClinics([]);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const items = useMemo(() => {
    const arr =
      tab === "clinics"
        ? clinics
        : tab === "doctors"
        ? doctors
        : [...clinics, ...doctors];

    const maxReviews = Math.max(0, ...arr.map((i) => i.totalReviews || 0));
    let premiumSet = false;

    return arr.map((p) => {
      if (!premiumSet && p.totalReviews === maxReviews && maxReviews > 0) {
        premiumSet = true;
        return { ...p, __isPremium: true };
      }
      return p;
    });
  }, [tab, clinics, doctors]);

  return (
    <section className="bg-white py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center">
                        <span className="inline-block rounded-full bg-teal-50 px-5 py-2 text-sm font-medium text-teal-700">
       Verified Partners
        </span>
         
          <p className="text-blue-700 text-[20px] font-medium text-4xl mt-6">
  Featured Clinics & Doctors
          </p>
           <h1 className="text-gray-600 text-[24px] text-base font-normal mt-4 " >
           Top-rated healthcare providers near you
          </h1>
        </div>
        <div className="mt-6 flex gap-3">
          <TabButton active={tab === "all"} onClick={() => setTab("all")}>
            All Specialities
          </TabButton>
          <TabButton
            active={tab === "clinics"}
            onClick={() => setTab("clinics")}
          >
            Top Clinics
          </TabButton>
          <TabButton
            active={tab === "doctors"}
            onClick={() => setTab("doctors")}
          >
            Top Doctors
          </TabButton>
        </div>

        {/* Carousel-based Pagination System */}
        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(CARDS_PER_VIEW)].map((_, i) => (
                <div
                  key={i}
                  className="h-[360px] bg-gray-100 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : items.length > 0 ? (
            <Carousel items={items} loading={loading} />
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full mb-6 shadow-lg">
                {tab === "doctors" ? (
                  <Stethoscope className="w-10 h-10 text-white" />
                ) : tab === "clinics" ? (
                  <Building2 className="w-10 h-10 text-white" />
                ) : (
                  <Sparkles className="w-10 h-10 text-white" />
                )}
              </div>
              <p className="text-gray-700 text-xl font-semibold mb-3">
                {tab === "doctors"
                  ? "Exploring more doctors for you"
                  : tab === "clinics"
                  ? "Discovering top clinics"
                  : "Finding the best providers"}
              </p>
              <p className="text-gray-500 text-base">
                New providers are being added regularly. Check back soon!
              </p>
              <div className="mt-8 h-2 bg-gradient-to-r from-teal-600 via-teal-400 to-teal-600 rounded-full max-w-md mx-auto"></div>
            </div>
          )}
        </div>

        <TelemedicinePromoSection />
      </div>
    </section>
  );
};

export default FeaturedClinicsDoctors;
