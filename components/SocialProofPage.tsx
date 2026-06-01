"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";

/* -------------------- COUNT HOOK -------------------- */
const useCountUp = (end: number, duration = 1500) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end, duration]);

  return count;
};

/* -------------------- STATS SECTION -------------------- */
const StatsSection = () => {
  const clinics = useCountUp(5000);
  const appointments = useCountUp(200000);
  const cities = useCountUp(50);
  const professionals = useCountUp(15000);

  const stats = [
    { value: clinics.toLocaleString() + "+", label: "Clinics Listed" },
    { value: appointments.toLocaleString() + "+", label: "Appointments Booked" },
    { value: cities + "+", label: "Cities Covered" },
    { value: professionals.toLocaleString() + "+", label: "Healthcare Professionals" },
  ];

  return (
    <div className="mb-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative rounded-[28px] border border-gray-200 bg-white px-6 py-14 shadow-xl">

          {/* Badge */}
          <div className="absolute -top-5 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-5 py-2 text-sm font-medium text-amber-600">
              📈 Growing Every Day
            </span>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 gap-10 text-center md:grid-cols-4">
            {stats.map((item, i) => (
              <div key={i} className="relative">
                <div className="text-4xl font-bold text-amber-400 md:text-5xl">
                  {item.value}
                </div>
                <div className="mt-2 font-medium text-gray-800">
                  {item.label}
                </div>

                {i !== stats.length - 1 && (
                  <span className="absolute right-0 top-1/2 hidden h-12 w-px -translate-y-1/2 bg-gray-200 md:block" />
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

/* -------------------- REVIEWS DATA -------------------- */
const allReviews = [
  {
    text: "ZEVA made it so easy to find a specialist near me. Booked my appointment in under 2 minutes!",
    name: "Priya Sharma",
    role: "Patient · Mumbai",
    initials: "PS",
  },
  {
    text: "Managing appointments has never been easier. The platform is intuitive and my patients love it.",
    name: "Dr. Rajesh Kumar",
    role: "Cardiologist · Delhi",
    initials: "RK",
  },
  {
    text: "The telemedicine feature saved me so much time. Got consultation from home easily.",
    name: "Anita Desai",
    role: "Patient · Bangalore",
    initials: "AD",
  },
  {
    text: "Excellent platform for discovering verified clinics nearby.",
    name: "Rohit Mehta",
    role: "Patient · Pune",
    initials: "RM",
  },
  {
    text: "My clinic operations are smoother than ever thanks to ZEVA.",
    name: "Dr. Neha Verma",
    role: "Dermatologist · Jaipur",
    initials: "NV",
  },
  {
    text: "Simple UI and very fast booking experience.",
    name: "Sanjay Patel",
    role: "Patient · Ahmedabad",
    initials: "SP",
  },
];

/* -------------------- MAIN COMPONENT -------------------- */
export default function SocialProofPage() {
  const [index, setIndex] = useState(0);

  const shuffledReviews = useMemo(
    () => [...allReviews].sort(() => Math.random() - 0.5),
    []
  );

  const visibleReviews = shuffledReviews.slice(index, index + 3);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) =>
        prev + 3 >= shuffledReviews.length ? 0 : prev + 3
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [shuffledReviews.length]);

  return (
    <section className="w-full bg-white py-16">
      <StatsSection />

      <div className="mx-auto mt-16 max-w-6xl px-4 text-center">
        <span className="inline-block rounded-full bg-teal-50 px-5 py-2 text-sm font-medium text-teal-700">
          Social Proof
        </span>

       <p className="text-blue-700 text-[20px] font-medium text-4xl mt-6">
         Trusted by Patients & Healthcare Providers
          </p>
        <h1 className="text-gray-600 text-[24px] text-base font-normal mt-4 " >
            Join thousands who trust ZEVA for their healthcare needs
          </h1>

        {/* Reviews */}
        <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-3">
          {visibleReviews.map((review) => (
            <div
              key={review.name}
              className="rounded-2xl border border-gray-200 bg-white p-8 text-left shadow-sm transition hover:shadow-md"
            >
              {/* Stars */}
              <div className="mb-5 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-[17px] leading-relaxed text-gray-700">
                “{review.text}”
              </p>

              <div className="mt-8 h-px w-full bg-gray-200" />

              {/* User */}
              <div className="mt-6 flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                  {review.initials}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{review.name}</p>
                  <p className="text-sm text-gray-500">{review.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
