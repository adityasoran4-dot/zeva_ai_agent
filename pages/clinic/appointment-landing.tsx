"use client";

import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, Users, Shield, CheckCircle2, ArrowRight, Star,FileText, Bell } from "lucide-react";
import AuthModal from "../../components/AuthModal";

const SLIDES = ["/image1.png", "/image2.png"] as const;

export default function AppointmentLandingPage(): React.ReactElement {
  const [imgOk, setImgOk] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);

  const title = useMemo(() => "ZEVA | Appointment Schedule", []);
  const currentSlideSrc = SLIDES[slideIndex] || SLIDES[0];
  const isMobileSlide = currentSlideSrc === "/image2.png";
const [showAuthModal, setShowAuthModal] = useState(false);
const [authMode, setAuthMode] = useState<"login" | "register">("login");

  useEffect(() => {
    // Reset error state when slide changes
    setImgOk(true);
  }, [slideIndex]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % SLIDES.length);
    }, 2500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta
          name="description"
          content="A modern appointment scheduling experience for clinics — fast, flexible, and easy to use."
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-white via-white to-gray-50">
        {/* Top bar */}
      

        {/* Hero */}
        <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <div className="flex flex-col items-center">
            {/* Title + CTA */}
            <div className="w-full max-w-3xl text-center">
           
              <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-900 sm:text-5xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                The #1 Appointment Scheduling Software for Healthcare
              </h1>
              <p className="mt-4 text-base text-gray-600 sm:text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                Manage doctors, rooms, and time-slots in one place — designed for seamless clinic workflows and better patient care.
              </p>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/clinic/appointment"
                  className="rounded-full bg-gray-900 px-6 py-3 text-sm font-bold text-white hover:bg-black transition"
                >
                  View schedule
                </Link>
                {/* <Link
                  href="/clinic/all-appointment"
                  className="rounded-full border border-gray-300 px-6 py-3 text-sm font-bold text-gray-900 hover:bg-gray-50 transition"
                >
                  All appointments
                </Link> */}
              </div>

          
            </div>

            {/* Screenshot section with colored background + stats (like reference) */}
            <div className="relative mt-10 w-full max-w-6xl">
              <div className="relative overflow-hidden rounded-3xl bg-white p-5 sm:p-7">
                {/* soft blobs */}
                <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
                <div className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-white/15 blur-3xl" />
                <div className="pointer-events-none absolute left-1/3 -bottom-24 h-80 w-80 rounded-full bg-pink-300/20 blur-3xl" />

                {/* Slideshow card */}
                <div className="relative overflow-hidden rounded-3xl border border-white/25 bg-white shadow-[0_20px_60px_-30px_rgba(0,0,0,0.55)]">
                  <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3">
                    {/* Slideshow controls */}
                    <div className="ml-auto flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {SLIDES.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSlideIndex(i)}
                            className={`h-2 w-2 rounded-full transition ${
                              i === slideIndex ? "bg-emerald-500" : "bg-orange-300 hover:bg-orange-400"
                            }`}
                            aria-label={`Go to screenshot ${i + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Fixed size container for BOTH slides */}
                  <div className="relative h-[420px] sm:h-[520px] bg-white">
                    {imgOk ? (
                      <Image
                        key={currentSlideSrc}
                        src={currentSlideSrc}
                        alt="Clinic appointment preview"
                        fill
                        className={`transition-opacity duration-300 object-contain bg-white ${
                          isMobileSlide ? "p-2 sm:p-4" : ""
                        }`}
                        sizes="(max-width: 1024px) 100vw, 1100px"
                        onError={() => setImgOk(false)}
                        priority
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-white p-6 text-center">
                        <div className="h-12 w-12 rounded-2xl bg-gray-900 text-black flex items-center justify-center font-black">
                          Z
                        </div>
                        <p className="text-sm font-bold text-gray-900">Screenshot not found</p>
                        <p className="text-sm text-gray-600">
                          Add the image at{" "}
                          <span className="font-mono text-[13px] text-gray-800">public{currentSlideSrc}</span>.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom stats strip */}
                <div className="mt-6 grid grid-cols-2 gap-5 text-center text-black sm:grid-cols-4">
                  <div>
                    <p className="text-xl sm:text-4xl font-black tracking-tight text-teal-600">5,000+</p>
                    <p className="mt-1 text-sm sm:text-base text-gray-700">Clinics Listed</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-4xl font-black tracking-tight text-teal-600">15,000+</p>
                    <p className="mt-1 text-sm sm:text-base text-gray-700">Healthcare Professionals</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-4xl font-black tracking-tight text-teal-600">200,000+</p>
                    <p className="mt-1 text-sm sm:text-base text-gray-700">Appointments Booked</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-4xl font-black tracking-tight text-teal-600">50+</p>
                    <p className="mt-1 text-sm sm:text-base text-gray-700">Cities Covered</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Powerful Features for Modern Clinics
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: "'Playfair Display', serif" }}>
                Everything you need to manage appointments efficiently and provide excellent patient care
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <Calendar className="w-8 h-8" />,
                  title: "Smart Scheduling",
                  desc: "Automated appointment booking with real-time availability and conflict detection."
                },
                {
                  icon: <Users className="w-8 h-8" />,
                  title: "Multi-Doctor Support",
                  desc: "Manage multiple doctors, staff, and rooms from a single dashboard."
                },
                {
                  icon: <Clock className="w-8 h-8" />,
                  title: "Flexible Time Slots",
                  desc: "Customize time slots, working hours, and break times for each doctor."
                },
                {
                  icon: <Bell className="w-8 h-8" />,
                  title: "Automated Reminders",
                  desc: "Send SMS and email reminders to patients before appointments."
                },
                {
                  icon: <FileText className="w-8 h-8" />,
                  title: "Patient Records",
                  desc: "Access complete patient history and medical records instantly."
                },
                {
                  icon: <Shield className="w-8 h-8" />,
                  title: "Secure & HIPAA Compliant",
                  desc: "Bank-level security with HIPAA compliance for patient data protection."
                }
              ].map((feature, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow border border-gray-200">
                  <div className="w-14 h-14 bg-teal-100 rounded-lg flex items-center justify-center mb-4 text-teal-600">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-gradient-to-br from-teal-50 to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Why Choose ZEVA Appointment System?
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {[
                {
                  title: "Save Time",
                  desc: "Reduce administrative work by up to 70% with automated scheduling and reminders."
                },
                {
                  title: "Increase Efficiency",
                  desc: "Optimize your clinic's capacity and reduce no-shows with smart scheduling."
                },
                {
                  title: "Better Patient Experience",
                  desc: "24/7 online booking and instant confirmations improve patient satisfaction."
                },
                {
                  title: "Real-time Updates",
                  desc: "Get instant notifications for new bookings, cancellations, and changes."
                }
              ].map((benefit, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-md">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                      <p className="text-gray-600">{benefit.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                How It Works
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: "'Playfair Display', serif" }}>
                Get started in three simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  step: "1",
                  title: "Set Up Your Clinic",
                  desc: "Add your clinic details, doctors, rooms, and working hours in minutes."
                },
                {
                  step: "2",
                  title: "Configure Time Slots",
                  desc: "Customize appointment durations, break times, and availability for each doctor."
                },
                {
                  step: "3",
                  title: "Start Booking",
                  desc: "Patients can book appointments online 24/7, and you'll get instant notifications."
                }
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Trusted by Healthcare Professionals
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Dr. Priya Sharma",
                  role: "Cardiologist, Mumbai",
                  text: "ZEVA has transformed how we manage appointments. The automated reminders have reduced no-shows by 40%.",
                  rating: 5
                },
                {
                  name: "Dr. Rajesh Kumar",
                  role: "General Physician, Delhi",
                  text: "Easy to use and saves so much time. Our patients love the online booking feature.",
                  rating: 5
                },
                {
                  name: "Dr. Neha Verma",
                  role: "Dermatologist, Jaipur",
                  text: "The best appointment management system we've used. Highly recommend it to all clinics.",
                  rating: 5
                }
              ].map((testimonial, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-md">
                  <div className="flex mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">"{testimonial.text}"</p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-teal-600 via-teal-500 to-blue-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Ready to Transform Your Clinic?
            </h2>
            <p className="text-lg mb-8 opacity-90" style={{ fontFamily: "'Playfair Display', serif" }}>
              Join thousands of healthcare providers using ZEVA to manage appointments efficiently.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
  onClick={() => {
    setAuthMode("login");
    setShowAuthModal(true);
  }}
  className="inline-flex items-center justify-center gap-2 bg-white text-teal-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors"
>
  Get Started Now
  <ArrowRight className="w-5 h-5" />
</button>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full font-semibold hover:bg-white/20 transition-colors border border-white/20"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </section>

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
      </div>
    </>
  );
}


