import React, { useState, useEffect, useRef } from 'react';
import { Heart, Users, MapPin, Calculator, Gamepad2, FileText, Briefcase, Shield, Award, Zap, ChevronRight, Star, Stethoscope, Activity, Brain, Pill, Microscope, Thermometer, Siren, UserCheck, Globe, Lock, Smartphone, TrendingUp } from 'lucide-react';
import Link from "next/link";
import Head from "next/head";

const AboutUs = () => {
    const [isVisible, setIsVisible] = useState({});
    const [currentStat, setCurrentStat] = useState(0);
    const [floatingIcons, setFloatingIcons] = useState([]);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    // Floating medical icons animation
    useEffect(() => {
        const icons = [
            { icon: <Stethoscope className="w-6 h-6" />, x: Math.random() * 100, y: Math.random() * 100, speed: 0.5 + Math.random() * 0.5 },
            { icon: <Activity className="w-5 h-5" />, x: Math.random() * 100, y: Math.random() * 100, speed: 0.3 + Math.random() * 0.7 },
            { icon: <Brain className="w-6 h-6" />, x: Math.random() * 100, y: Math.random() * 100, speed: 0.4 + Math.random() * 0.6 },
            { icon: <Pill className="w-5 h-5" />, x: Math.random() * 100, y: Math.random() * 100, speed: 0.2 + Math.random() * 0.8 },
            { icon: <Microscope className="w-6 h-6" />, x: Math.random() * 100, y: Math.random() * 100, speed: 0.6 + Math.random() * 0.4 },
            { icon: <Thermometer className="w-5 h-5" />, x: Math.random() * 100, y: Math.random() * 100, speed: 0.3 + Math.random() * 0.5 },
        ];
        setFloatingIcons(icons);

        const animateIcons = () => {
            setFloatingIcons(prev => prev.map(icon => ({
                ...icon,
                y: (icon.y + icon.speed) % 100
            })));
        };

        const interval = setInterval(animateIcons, 100);
        return () => clearInterval(interval);
    }, []);

    // Mouse tracking for parallax effect
    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth) * 100,
                y: (e.clientY / window.innerHeight) * 100
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
                    }
                });
            },
            { threshold: 0.1 }
        );

        document.querySelectorAll('[id^="section-"]').forEach((el) => {
            observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStat(prev => (prev + 1) % 4);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const features = [
        {
            icon: <Shield className="w-8 h-8" />,
            title: "Healthcare Provider Registration & Management",
            description: "ZEVA offers a robust registration system for clinics and medical professionals featuring multi-step verification, admin approval workflows, profile management, personalized dashboards, patient tracking, appointment scheduling, revenue monitoring, and complete service management tools to enhance operational efficiency."

        },
        {
            icon: <MapPin className="w-8 h-8" />,
            title: "Advanced Geolocation & Provider Discovery",
            description: "Our location-based search engine uses GPS technology, radius-based filtering, specialty-specific searches, real-time availability updates, and route optimization. Providers’ profiles include ratings, reviews, operating hours, services, and insurance acceptance, helping patients make informed healthcare decisions."

        },
        {
            icon: <Calculator className="w-8 h-8" />,
            title: "Interactive Health Tools & Wellness Games",
            description: "ZEVA provides medical calculators and educational games covering nutrition, fitness, symptom checking, and wellness goals. These tools help patients maintain a healthy lifestyle while improving medical literacy."
        },
        {
            icon: <Briefcase className="w-8 h-8" />,
            title: "Professional Networking & Content Management",
            description: "Our platform allows healthcare professionals to post jobs, internships, research projects, and share blogs, case studies, and medical insights. Features include social sharing, comments, and collaborative networking opportunities."
        }
    ];

    const stats = [
        { number: "1,200+", label: "Verified Healthcare Providers & Medical Centers", icon: <Users className="w-6 h-6" /> },
        { number: "50,000+", label: "Active Patients & Healthcare Seekers", icon: <Heart className="w-6 h-6" /> },
        { number: "150+", label: "Cities & Metropolitan Areas Covered", icon: <MapPin className="w-6 h-6" /> },
        { number: "98.5%", label: "User Satisfaction & Platform Reliability", icon: <Star className="w-6 h-6" /> }
    ];      

    const values = [
        { icon: <Heart className="w-6 h-6" />, title: "Patient-Centric Healthcare Excellence", desc:" Prioritizing accessibility, care quality, and positive health outcomes." },
        { icon: <Shield className="w-6 h-6" />, title: "Trust, Security & Data Privacy", desc: "Ensuring HIPAA compliance, advanced encryption, and secure medical data." },
        { icon: <Zap className="w-6 h-6" />, title: "Technological Innovation & Advancement", desc: " Leveraging AI, machine learning, and digital health technologies." },
        { icon: <Award className="w-6 h-6" />, title: "Medical Excellence & Quality Assurance", desc: "Maintaining the highest standards in professional care and platform performance." }
    ];

    return (
        <>
            <Head>
                <title>About ZEVA – Digital Healthcare Platform & Verified Providers</title>
                <meta name="description" content="Discover ZEVA, a digital healthcare platform connecting patients with verified providers, wellness tools, interactive health calculators, and comprehensive services." />
                <meta name="keywords" content="ZEVA healthcare platform, digital healthcare, verified healthcare providers, wellness tools, interactive health calculators, medical services management, healthcare technology, patient care platform, medical professional networking, online health tools" />
                <meta property="og:title" content="About ZEVA – Digital Healthcare Platform & Verified Providers" />
                <meta property="og:description" content="Discover ZEVA, a digital healthcare platform connecting patients with verified providers, wellness tools, interactive health calculators, and comprehensive services." />
                <meta property="og:url" content="https://zeva360.com/about-us" />
                <link rel="canonical" href="https://zeva360.com/about-us" />
                {/* Schema Markup - Job Posting */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "JobPosting",
                            "title": "Careers at ZEVA",
                            "url": "https://zeva360.com/aboutus",
                            "description": "Explore exciting career opportunities at ZEVA. Discover job openings for healthcare professionals, IT specialists, and wellness experts across multiple locations. Apply for full-time, part-time, or remote positions with transparent salary information.",
                            "hiringOrganization": {
                                "@type": "Organization",
                                "name": "ZEVA",
                                "sameAs": "https://zeva360.com",
                                "logo": "https://zeva360.com/logo.png"
                            },
                            "jobLocation": {
                                "@type": "Place",
                                "address": {
                                    "@type": "PostalAddress",
                                    "streetAddress": "Abu Dhabi, UAE",
                                    "addressLocality": "Abu Dhabi",
                                    "addressCountry": "AE"
                                }
                            },
                            "datePosted": "2025-12-18",
                            "employmentType": "FULL_TIME",
                            "validThrough": "2026-12-31T23:59",
                            "baseSalary": {
                                "@type": "MonetaryAmount",
                                "currency": "AED",
                                "value": {
                                    "@type": "QuantitativeValue",
                                    "value": "70000",
                                    "unitText": "YEAR"
                                }
                            }
                        })
                    }}
                />
            </Head>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
                {/* Floating Medical Icons Background */}
                <div className="absolute inset-0 overflow-hidden">
                    {floatingIcons.map((item, index) => (
                        <div
                            key={index}
                            className="absolute text-white/10 animate-float"
                            style={{
                                left: `${item.x}%`,
                                top: `${item.y}%`,
                                animationDelay: `${index * 0.5}s`,
                                transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px)`
                            }}
                        >
                            {item.icon}
                        </div>
                    ))}
                </div>

                {/* Animated Background Patterns */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full animate-pulse-slow"></div>
                    <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-pink-300/10 rounded-full animate-bounce-slow"></div>
                    <div className="absolute bottom-1/4 left-1/3 w-32 h-32 bg-yellow-300/10 rounded-full animate-spin-slow"></div>
                </div>

                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative container mx-auto px-4 py-20 lg:py-32">
                    <div className="text-center max-w-4xl mx-auto">
                        {/* Animated Medical Cross */}
                        <div className="relative mb-6">
                            <div className="animate-pulse-fast mb-4">
                                <div className="w-20 h-20 mx-auto relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-pink-300 to-red-300 rounded-full animate-ping"></div>
                                    <Heart className="w-16 h-16 mx-auto text-pink-300 animate-bounce relative z-10 mt-2 ml-2" />
                                </div>
                            </div>
                            {/* Orbiting Icons */}
                            <div className="absolute inset-0 animate-spin-reverse">
                                <Stethoscope className="absolute top-0 left-1/2 w-8 h-8 text-blue-200 animate-bounce" style={{ marginLeft: '-16px' }} />
                                <Activity className="absolute bottom-0 left-1/2 w-8 h-8 text-green-200 animate-bounce" style={{ marginLeft: '-16px', animationDelay: '0.5s' }} />
                                <Shield className="absolute top-1/2 left-0 w-8 h-8 text-purple-200 animate-bounce" style={{ marginTop: '-16px', animationDelay: '1s' }} />
                                <Brain className="absolute top-1/2 right-0 w-8 h-8 text-yellow-200 animate-bounce" style={{ marginTop: '-16px', animationDelay: '1.5s' }} />
                            </div>
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fadeIn">
                            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-yellow-300 animate-gradient">ZEVA</span>
                        </h1>
                        <p className="text-xl md:text-2xl opacity-90 animate-slideUp max-w-3xl mx-auto leading-relaxed">
                        ZEVA is a digital healthcare platform connecting patients and professionals through smart tools and transparent services, making quality care accessible for all. With 1,200+ verified providers, 50,000+ users, and presence in 150+ cities, ZEVA maintains 98.5% user satisfaction built on trust and excellence.
                        </p>

                        {/* Animated Stats Preview */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-2xl mx-auto">
                            {['1200+', '50K+', '150+', '98.5%'].map((stat, i) => (
                                <div key={i} className={`bg-white/10 rounded-xl p-4 backdrop-blur-sm animate-slideUp`} style={{ animationDelay: `${i * 0.2}s` }}>
                                    <div className="text-2xl font-bold animate-counter">{stat}</div>
                                    <div className="text-sm opacity-80">
                                        {['Providers', 'Users', 'Cities', 'Satisfaction'][i]}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-blue-50 to-transparent"></div>
            </section>

            {/* Mission Statement */}
            <section id="section-mission" className="py-16 lg:py-24 relative overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-10 right-10 w-40 h-40 bg-blue-100 rounded-full animate-float opacity-20"></div>
                    <div className="absolute bottom-20 left-10 w-60 h-60 bg-indigo-100 rounded-full animate-float-reverse opacity-15"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className={`max-w-4xl mx-auto transition-all duration-1000 ${isVisible['section-mission'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        {/* Animated Title with Medical Icons */}
                        <div className="relative mb-8 text-center">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-8">
                                Our Mission
                            </h2>
                            {/* Decorative animated icons */}
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                <div className="flex space-x-4 animate-bounce">
                                    <Siren className="w-6 h-6 text-red-400" />
                                    <UserCheck className="w-6 h-6 text-green-400" />
                                    <Globe className="w-6 h-6 text-blue-400" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12 border border-gray-100 relative overflow-hidden">
                            {/* Animated background pattern */}
                            <div className="absolute inset-0 opacity-5">
                                <div className="grid grid-cols-8 h-full">
                                    {Array(64).fill().map((_, i) => (
                                        <div key={i} className={`animate-pulse`} style={{ animationDelay: `${i * 0.1}s` }}>
                                            <Heart className="w-4 h-4 text-blue-500 m-2" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="text-lg md:text-xl text-gray-700 leading-relaxed relative z-10 space-y-6 text-left">
                                <p className="text-justify">
                                    At ZEVA, our mission is to bridge the digital divide in healthcare services. We empower healthcare centers and medical professionals with advanced administrative dashboards, complete patient and service management tools, and seamless registration systems. For patients, we provide intuitive features to locate nearby healthcare providers, access wellness tools, and stay informed about their health.
                                </p>
                                
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-l-4 border-blue-600">
                                    <p className="font-bold text-gray-800 text-xl mb-4">Our platform integrates:</p>
                                    
                                    <ul className="space-y-4 list-none pl-0">
                                        <li className="flex items-start group hover:bg-white/50 rounded-lg p-3 transition-all duration-300">
                                            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-4 mt-0.5 group-hover:scale-110 transition-transform duration-300">
                                                <Calculator className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <span className="font-semibold text-gray-800">Interactive Health Calculators</span>
                                                <span className="text-gray-600"> – BMI, calorie counters, pregnancy trackers, medication dosage calculators, and risk assessment tools.</span>
                                            </div>
                                        </li>
                                        <li className="flex items-start group hover:bg-white/50 rounded-lg p-3 transition-all duration-300">
                                            <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center mr-4 mt-0.5 group-hover:scale-110 transition-transform duration-300">
                                                <Gamepad2 className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <span className="font-semibold text-gray-800">Wellness & Educational Games</span>
                                                <span className="text-gray-600"> – Fun, engaging ways to boost medical literacy and promote healthy lifestyle choices.</span>
                                            </div>
                                        </li>
                                        <li className="flex items-start group hover:bg-white/50 rounded-lg p-3 transition-all duration-300">
                                            <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-4 mt-0.5 group-hover:scale-110 transition-transform duration-300">
                                                <Briefcase className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <span className="font-semibold text-gray-800">Professional Networking & Content Management</span>
                                                <span className="text-gray-600"> – Medical job postings, blogs, research articles, case studies, and collaborative projects.</span>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                                
                                <p className="text-justify">
                                    Using advanced geolocation technology, secure data management, and user-friendly design, ZEVA creates a unified digital healthcare ecosystem where technology meets patient-centered care.
                                </p>
                            </div>

                            {/* Floating mini icons */}
                            <div className="absolute top-4 right-4">
                                <Lock className="w-5 h-5 text-blue-400 animate-pulse" />
                            </div>
                            <div className="absolute bottom-4 left-4">
                                <Smartphone className="w-5 h-5 text-green-400 animate-bounce" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dynamic Stats */}
            <section className="py-16 bg-gradient-to-r from-indigo-500 to-purple-600 text-white relative overflow-hidden">
                {/* Animated Background Shapes */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-1/4 w-72 h-72 bg-white/5 rounded-full animate-spin-slow"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-300/5 rounded-full animate-pulse-slow"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-8">
                        <h3 className="text-2xl md:text-3xl font-bold mb-4">Platform Impact</h3>
                        <div className="flex justify-center space-x-2 animate-bounce">
                            <TrendingUp className="w-6 h-6" />
                            <Activity className="w-6 h-6" />
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className={`text-center transition-all duration-500 transform hover:scale-110 ${currentStat === index ? 'scale-110 bg-white/20 rounded-2xl p-4' : 'hover:bg-white/10 rounded-2xl p-4'}`}>
                                <div className="flex justify-center mb-3 relative">
                                    <div className="animate-bounce" style={{ animationDelay: `${index * 0.2}s` }}>
                                        {stat.icon}
                                    </div>
                                    {/* Pulsing ring effect */}
                                    <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping"></div>
                                </div>
                                <div className="text-2xl md:text-3xl font-bold mb-2 animate-counter">{stat.number}</div>
                                <div className="text-sm md:text-base opacity-90">{stat.label}</div>

                                {/* Progress bar animation */}
                                <div className="mt-3 bg-white/20 rounded-full h-1">
                                    <div className="bg-white rounded-full h-1 animate-progress" style={{ width: `${75 + index * 5}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="section-features" className="py-16 lg:py-24 relative overflow-hidden">
                {/* Medical-themed background animations */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-20 right-20 animate-float">
                        <Stethoscope className="w-32 h-32 text-blue-500" />
                    </div>
                    <div className="absolute bottom-20 left-20 animate-float-reverse">
                        <Brain className="w-28 h-28 text-purple-500" />
                    </div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className={`text-center mb-16 transition-all duration-1000 ${isVisible['section-features'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <div className="relative mb-6">
                            {/* Animated medical cross */}
                            <div className="w-16 h-16 mx-auto mb-4 relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg animate-pulse"></div>
                                <div className="absolute inset-2 bg-white rounded transform rotate-45"></div>
                                <div className="absolute inset-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded"></div>
                            </div>
                        </div>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
                            Platform Features
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Comprehensive healthcare solutions designed for modern digital needs
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                        {features.map((feature, index) => (
                            <div key={index} className={`group bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 relative overflow-hidden ${isVisible['section-features'] ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`} style={{ transitionDelay: `${index * 200}ms` }}>
                                {/* Animated background gradient */}
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                {/* Floating particles effect */}
                                <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4 relative z-10">
                                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 relative">
                                        {feature.icon}
                                        {/* Pulsing ring */}
                                        <div className="absolute -inset-1 bg-blue-400 rounded-xl opacity-0 group-hover:opacity-30 animate-ping"></div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors duration-300">{feature.title}</h3>
                                        <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                                        <div className="flex items-center mt-3 text-indigo-500 group-hover:text-indigo-600">
                                            <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                                            <span className="ml-1 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">Learn More</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress indicator */}
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-100">
                                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section id="section-values" className="py-16 lg:py-24 bg-gray-50 relative overflow-hidden">
                {/* Animated background medical symbols */}
                <div className="absolute inset-0 opacity-5">
                    <div className="grid grid-cols-12 gap-4 h-full">
                        {Array(48).fill().map((_, i) => (
                            <div key={i} className={`flex items-center justify-center animate-float`} style={{ animationDelay: `${i * 0.1}s`, animationDuration: `${3 + (i % 3)}s` }}>
                                {[<Heart key={i} />, <Shield key={i} />, <Zap key={i} />, <Award key={i} />][i % 4]}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className={`text-center mb-16 transition-all duration-1000 ${isVisible['section-values'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <div className="relative mb-6">
                            {/* Animated value icons orbiting */}
                            <div className="w-24 h-24 mx-auto relative">
                                <div className="absolute inset-0 animate-spin-slow">
                                    <Heart className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-6 h-6 text-red-400" />
                                    <Shield className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-6 h-6 text-blue-400" />
                                    <Zap className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-6 text-yellow-400" />
                                    <Award className="absolute top-1/2 -left-2 transform -translate-y-1/2 w-6 h-6 text-green-400" />
                                </div>
                                <div className="absolute inset-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse-fast"></div>
                            </div>
                        </div>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
                            Our Core Values
                        </h2>
                        <div className="flex justify-center space-x-4 animate-bounce">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <div className="w-3 h-3 bg-indigo-500 rounded-full" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-3 h-3 bg-purple-500 rounded-full" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {values.map((value, index) => (
                            <div key={index} className={`bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 relative overflow-hidden group ${isVisible['section-values'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${index * 150}ms` }}>
                                {/* Animated background gradient */}
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                {/* Medical pulse effect */}
                                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 medical-pulse group-hover:scale-110 transition-transform duration-300 relative z-10">
                                    <div className="animate-bounce">
                                        {value.icon}
                                    </div>
                                </div>

                                {/* Floating particles */}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    <div className="flex space-x-1">
                                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
                                        <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>

                                <h3 className="font-bold text-gray-800 mb-2 relative z-10 group-hover:text-indigo-600 transition-colors duration-300">{value.title}</h3>
                                <p className="text-gray-600 text-sm relative z-10 group-hover:text-gray-700 transition-colors duration-300">{value.desc}</p>

                                {/* Progress bar */}
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200">
                                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Vision Section */}
            <section id="section-vision" className="py-16 lg:py-24 relative overflow-hidden">
                {/* Animated DNA helix background */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-2 h-96 bg-gradient-to-b from-blue-400 to-transparent animate-float opacity-10"></div>
                    <div className="absolute top-1/3 right-1/4 w-2 h-80 bg-gradient-to-b from-indigo-400 to-transparent animate-float-reverse opacity-10"></div>
                    <div className="absolute bottom-1/4 left-1/3 w-2 h-64 bg-gradient-to-t from-purple-400 to-transparent animate-float opacity-10"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${isVisible['section-vision'] ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                        {/* Animated vision icon */}
                        <div className="relative mb-8">
                            <div className="w-20 h-20 mx-auto relative">
                                {/* Rotating outer ring */}
                                <div className="absolute inset-0 border-4 border-dashed border-blue-400 rounded-full animate-spin-slow"></div>
                                {/* Pulsing inner circle */}
                                <div className="absolute inset-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse-fast flex items-center justify-center">
                                    <Globe className="w-8 h-8 text-white animate-bounce" />
                                </div>
                                {/* Orbiting mini icons */}
                                <div className="absolute inset-0 animate-spin-reverse">
                                    <Heart className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 text-red-400 heartbeat" />
                                    <Stethoscope className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-4 h-4 text-green-400 animate-wiggle" />
                                    <Brain className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 text-purple-400 animate-bounce" />
                                    <Shield className="absolute top-1/2 -left-2 transform -translate-y-1/2 w-4 h-4 text-blue-400 animate-pulse" />
                                </div>
                            </div>
                        </div>

                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-8">
                            Our Vision
                        </h2>

                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden">
                            {/* Animated background pattern */}
                            <div className="absolute inset-0 opacity-10">
                                <div className="grid grid-cols-6 h-full">
                                    {Array(30).fill().map((_, i) => (
                                        <div key={i} className={`flex items-center justify-center animate-pulse`} style={{ animationDelay: `${i * 0.2}s` }}>
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Floating medical icons */}
                            <div className="absolute top-4 right-4 animate-float">
                                <Microscope className="w-8 h-8 text-white/20" />
                            </div>
                            <div className="absolute bottom-4 left-4 animate-float-reverse">
                                <Activity className="w-8 h-8 text-white/20" />
                            </div>

                            <p className="text-lg md:text-xl leading-relaxed relative z-10">
                            ZEVA envisions becoming the premier global healthcare technology platform, establishing a seamless digital ecosystem where patients, healthcare institutions, and medical professionals collaborate efficiently. Our goal is to eliminate geographical barriers to quality healthcare through innovative technology while maintaining the highest standards of medical ethics, data security, and patient confidentiality.
By integrating verified medical professionals, comprehensive health resources, and personalized care tools, ZEVA is transforming how healthcare is delivered, accessed, and experienced worldwide. 

                            </p>

                            {/* Animated progress indicators */}
                            <div className="flex justify-center space-x-4 mt-6">
                                {Array(5).fill().map((_, i) => (
                                    <div key={i} className={`w-3 h-3 bg-white/30 rounded-full animate-bounce`} style={{ animationDelay: `${i * 0.1}s` }}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-gradient-to-r from-purple-600 to-indigo-600 text-white relative overflow-hidden">
                {/* Animated medical background */}
                <div className="absolute inset-0">
                    {/* Floating medical symbols */}
                    {Array(15).fill().map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-float opacity-10"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${i * 0.3}s`,
                                animationDuration: `${4 + Math.random() * 2}s`
                            }}
                        >
                            {[<Heart key={i} />, <Stethoscope key={i} />, <Activity key={i} />, <Brain key={i} />, <Shield key={i} />][i % 5]}
                        </div>
                    ))}

                    {/* Animated pulse waves */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-96 h-96 border border-white/10 rounded-full animate-ping"></div>
                        <div className="w-80 h-80 border border-white/10 rounded-full animate-ping absolute top-8 left-8" style={{ animationDelay: '0.5s' }}></div>
                        <div className="w-64 h-64 border border-white/10 rounded-full animate-ping absolute top-16 left-16" style={{ animationDelay: '1s' }}></div>
                    </div>
                </div>

                <div className="container mx-auto px-4 text-center relative z-10">
                    {/* Animated medical cross icon */}
                    <div className="w-16 h-16 mx-auto mb-6 relative">
                        <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                        <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                            <Heart className="w-8 h-8 text-purple-600 heartbeat" />
                        </div>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold mb-6 animate-slideUp">
                        Ready to Transform Healthcare?
                    </h2>

                    <p className="text-xl mb-8 opacity-90 animate-slideUp" style={{ animationDelay: '0.2s' }}>
                        Join thousands of healthcare professionals and patients on ZEVA
                    </p>

                    {/* Animated statistics ticker */}
                    <div className="flex justify-center space-x-8 mb-8 text-sm opacity-80">
                        <div className="animate-counter">1200+ Providers</div>
                        <div className="animate-counter" style={{ animationDelay: '0.2s' }}>50K+ Users</div>
                        <div className="animate-counter" style={{ animationDelay: '0.4s' }}>150+ Cities</div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/" passHref>
                            <button className="bg-white text-indigo-600 px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 hover:shadow-lg medical-pulse relative overflow-hidden group">
                                <span className="relative z-10">Get Started Today</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                                <ChevronRight className="inline w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                            </button>
                        </Link>
                    </div>

                    {/* Trust indicators */}
                    <div className="mt-12 flex justify-center items-center space-x-6 opacity-60">
                        <div className="flex items-center space-x-2">
                            <Shield className="w-5 h-5" />
                            <span className="text-sm">HIPAA Compliant</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Lock className="w-5 h-5" />
                            <span className="text-sm">Secure Platform</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Award className="w-5 h-5" />
                            <span className="text-sm">Verified Providers</span>
                        </div>
                    </div>
                </div>
            </section>

            <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(20px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }
        @keyframes pulse-fast {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes counter {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(3deg); }
          75% { transform: rotate(-3deg); }
        }
        @keyframes heartbeat {
          0% { transform: scale(1); }
          14% { transform: scale(1.1); }
          28% { transform: scale(1); }
          42% { transform: scale(1.1); }
          70% { transform: scale(1); }
        }
        @keyframes medical-pulse {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        
        .animate-fadeIn { animation: fadeIn 1s ease-out; }
        .animate-slideUp { animation: slideUp 1s ease-out 0.5s both; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-float-reverse { animation: float-reverse 4s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .animate-spin-reverse { animation: spin-reverse 15s linear infinite; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-pulse-fast { animation: pulse-fast 2s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
        .animate-gradient { animation: gradient 3s ease infinite; background-size: 200% 200%; }
        .animate-counter { animation: counter 0.8s ease-out; }
        .animate-progress { animation: progress 2s ease-out; }
        .animate-wiggle { animation: wiggle 1s ease-in-out infinite; }
        .heartbeat { animation: heartbeat 1.5s ease-in-out infinite; }
        .medical-pulse { animation: medical-pulse 2s infinite; }
      `}</style>
        </div>
        </>
    );
};

export default AboutUs;