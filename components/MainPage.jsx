import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    Calendar,
    Heart,
    Users,
    Sparkles,
    Search,
    ArrowRight
} from 'lucide-react';

const ZevaHealthPlatform = () => {
    const router = useRouter();
    const [showComingSoon, setShowComingSoon] = useState(false);
    const [count, setCount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleBookAppointment = () => {
        setShowComingSoon(true);
        setTimeout(() => setShowComingSoon(false), 3000);
    };

    const formatCount = (num) => {
        if (num === null || num === undefined || isNaN(num)) return "0";

        if (num >= 1_000_000) {
            return (num / 1_000_000).toFixed(1) + 'M';
        } else if (num >= 1_000) {
            return (num / 1_000).toFixed(1) + 'K';
        } else {
            return num.toString();
        }
    };

    useEffect(() => {
        const fetchUserCount = async () => {
            try {
                const res = await fetch('/api/users/users');
                const data = await res.json();

                if (!res.ok) throw new Error(data.message || 'Failed to fetch');

                setCount(data.count);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUserCount();
    }, []);

    return (
        <main className="w-full bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100">
            {/* <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div className="grid lg:grid-cols-2 gap-10 items-center">
                    
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-1 text-xs font-semibold text-blue-700">
                            <Sparkles className="w-4 h-4 text-blue-500" />
                            Zeva | All-in-One Healthcare Platform for Doctors & Clinics
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
                            Trusted Doctors and Clinics for Every Healthcare Need

                            </h1>
                            <p className="text-base text-gray-600 max-w-xl">
                            Zeva connects users with trusted doctors and clinics across all medical treatments. Access healthcare, wellness tools, and career resources in a single, clutter-free platform. Easily book doctor visits, plan therapies, and manage wellness goals while making informed decisions through verified providers and smart health tools.
                            </p>
                        </div>

                    
                        <div className="rounded-3xl bg-white shadow-xl border border-blue-100 p-5">
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                                <div>
                                    <p className="text-xs tracking-wide text-blue-500 font-semibold uppercase">Find & Search Doctor</p>
                                    <h2 className="text-lg font-bold text-gray-900">Schedule a visit in under a minute</h2>
                                </div>
                                <span className="text-xs font-semibold text-gray-500">Live data</span>
                            </div>
                            <div className="pt-4 space-y-6 text-sm text-gray-600">
                                <p>
                                    Tell us how you want to connect and we’ll surface the best-matching specialists or partner clinics instantly—no long forms or confusing filters.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        type="button"
                                        onClick={() => router.push('/doctor/search')}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:-translate-y-0.5 transition"
                                    >
                                        <Search className="w-4 h-4" />
                                        Search doctors
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => router.push('/clinic/findclinic')}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow hover:border-gray-300 hover:-translate-y-0.5 transition"
                                    >
                                        <Heart className="w-4 h-4 text-blue-500" />
                                        Explore clinics
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-gray-500">
                                <div>
                                    <p className="font-semibold text-gray-900">4.9/5</p>
                                    Patient rating
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">24h</p>
                                    Avg. confirmation
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">35+ cities</p>
                                    Global telehealth
                                </div>
                            </div>
                        </div>

            
                        <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex-1 min-w-[120px] rounded-2xl bg-white/80 px-4 py-3 shadow">
                                <p className="text-xs uppercase text-gray-500">Active users</p>
                                <p className="text-xl font-bold text-gray-900">{formatCount(count)}</p>
                            </div>
                            <div className="flex-1 min-w-[120px] rounded-2xl bg-white/80 px-4 py-3 shadow">
                                <p className="text-xs uppercase text-gray-500">Modules</p>
                                <p className="text-xl font-bold text-gray-900">8</p>
                            </div>
                            <div className="flex-1 min-w-[120px] rounded-2xl bg-white/80 px-4 py-3 shadow">
                                <p className="text-xs uppercase text-gray-500">Care plans</p>
                                <p className="text-xl font-bold text-gray-900">24+</p>
                            </div>
                        </div>
                    </div>

                
                    <div className="space-y-4">
                        <div className="rounded-[28px] overflow-hidden bg-white/60 shadow-2xl border border-white/60">
                            <img
                                src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=1200&q=80"
                                alt="Medical consultation"
                                className="w-full h-[360px] object-cover"
                            />                      <div className="px-6 py-5 space-y-4">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Users className="w-4 h-4 text-blue-500" />
                                    200+ verified practitioners online now
                                </div>
                                <p className="text-sm text-gray-700">
                                    “Zeva lets me blend traditional Ayurveda with modern monitoring tools. Patients love how effortless booking feels.”
                                </p>
                                
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4 text-sm">
                            <button
                                onClick={() => router.push('/clinic/findclinic')}
                                className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/90 px-4 py-3 text-left shadow hover:-translate-y-0.5 transition"
                            >
                                <div>
                                    <p className="text-xs uppercase text-gray-500">Clinic finder</p>
                                    <p className="font-semibold text-gray-900">10 curated partners</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                            </button>
                            <button
                                onClick={() => router.push('/doctor/search')}
                                className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/90 px-4 py-3 text-left shadow hover:-translate-y-0.5 transition"
                            >
                                <div>
                                    <p className="text-xs uppercase text-gray-500">Doctor search</p>
                                    <p className="font-semibold text-gray-900">Smart filters</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>

                        <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-white px-5 py-4 shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-teal-600">Care coach</p>
                                    <p className="text-lg font-semibold text-teal-700">Need guidance on programs?</p>
                                </div>
                                <button
                                    onClick={handleBookAppointment}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 hover:bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition"
                                >
                                    <Calendar className="w-4 h-4" />
                                    {showComingSoon ? 'Coming soon' : 'Talk to us'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section> */}
        </main>
    );
};

export default ZevaHealthPlatform;