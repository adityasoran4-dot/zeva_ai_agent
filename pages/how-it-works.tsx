import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Search, Calendar, FileText, Video, Shield, Clock, CheckCircle2, ArrowRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const HowItWorks: React.FC = () => {
  return (
    <>
      <Head>
        <title>How It Works - ZEVA Healthcare Platform</title>
        <meta
          name="description"
          content="Learn how ZEVA works - discover clinics, book appointments, manage health records, and access telemedicine services all in one platform."
        />
        <meta name="robots" content="index, follow" />
      </Head>
      
      {/* Hero Banner Section */}
      <section className="relative h-[400px] sm:h-[500px] overflow-hidden flex items-center justify-center text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-600 to-purple-600">
          <img
            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1920&h=800&fit=crop&auto=format"
            alt="How ZEVA Works"
            className="w-full h-full object-cover opacity-30"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center px-4 max-w-screen-md">
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            How It Works
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="text-lg sm:text-xl text-white/90"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Discover how ZEVA makes healthcare accessible, simple, and convenient for everyone
          </motion.p>
        </div>
      </section>

      <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 py-16">

            {/* Main Steps Section */}
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Search className="w-10 h-10 text-white" />
                </div>
                {/* <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 -mt-8">
                  <span className="text-xl font-bold text-blue-700">1</span>
                </div> */}
                <h3 className="text-xl font-semibold text-gray-900 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Find & Search
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Search for clinics, doctors, and healthcare services near you. Filter by location, specialty, and availability.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Calendar className="w-10 h-10 text-white" />
                </div>
                {/* <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 -mt-8">
                  <span className="text-xl font-bold text-blue-700">2</span>
                </div> */}
                <h3 className="text-xl font-semibold text-gray-900 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Book Appointment
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Book appointments online instantly. Choose your preferred date and time, and get instant confirmation.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <FileText className="w-10 h-10 text-white" />
                </div>
                {/* <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 -mt-8">
                  <span className="text-xl font-bold text-purple-700">3</span>
                </div> */}
                <h3 className="text-xl font-semibold text-gray-900 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Manage Health
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Access your health records, manage prescriptions, and use telemedicine services all in one place.
                </p>
              </div>
            </div>

            {/* Detailed Process Section */}
            <div className="mt-20 bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>
                Complete Process Guide
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Search className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-lg">Search Healthcare Providers</h4>
                      <p className="text-gray-600 leading-relaxed">
                        Use our advanced search to find clinics and doctors by location, specialty, treatment type, or name. Get instant results with verified information.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-lg">Schedule Your Visit</h4>
                      <p className="text-gray-600 leading-relaxed">
                        Select your preferred date and time slot. View real-time availability and get instant booking confirmation via email and SMS.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-lg">Telemedicine Consultations</h4>
                      <p className="text-gray-600 leading-relaxed">
                        Connect with doctors via secure video calls. Get prescriptions, medical advice, and follow-up care from the comfort of your home.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-lg">Access Health Records</h4>
                      <p className="text-gray-600 leading-relaxed">
                        View and manage your complete medical history, prescriptions, lab reports, and treatment records in one secure place.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-lg">Insurance & Payments</h4>
                      <p className="text-gray-600 leading-relaxed">
                        Check which clinics accept your insurance. View transparent pricing and make secure payments online.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-lg">Reviews & Ratings</h4>
                      <p className="text-gray-600 leading-relaxed">
                        Read authentic patient reviews and ratings. Share your experience to help others make informed healthcare decisions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Why Choose ZEVA Section */}
            <div className="mt-16 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>
                Why Choose ZEVA?
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4 p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 text-lg">Verified Clinics & Doctors</h4>
                    <p className="text-gray-600 leading-relaxed">All healthcare providers are verified and trusted with proper credentials and certifications</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 text-lg">Easy Booking</h4>
                    <p className="text-gray-600 leading-relaxed">Book appointments in just a few clicks with instant confirmation and reminders</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 text-lg">24/7 Access</h4>
                    <p className="text-gray-600 leading-relaxed">Access healthcare services anytime, anywhere with our online platform</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 text-lg">Secure & Private</h4>
                    <p className="text-gray-600 leading-relaxed">Your health data is protected with industry-standard security and HIPAA compliance</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="mt-16 bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>
                Key Features
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { icon: <Search className="w-6 h-6" />, title: "Advanced Search", desc: "Find clinics and doctors by location, specialty, and availability" },
                  { icon: <Calendar className="w-6 h-6" />, title: "Online Booking", desc: "Schedule appointments instantly with real-time availability" },
                  { icon: <Video className="w-6 h-6" />, title: "Telemedicine", desc: "Video consultations with verified healthcare professionals" },
                  { icon: <FileText className="w-6 h-6" />, title: "Health Records", desc: "Access and manage your complete medical history" },
                  { icon: <Shield className="w-6 h-6" />, title: "Insurance Support", desc: "Find clinics that accept your insurance plan" },
                  { icon: <Star className="w-6 h-6" />, title: "Patient Reviews", desc: "Read authentic reviews from verified patients" },
                ].map((feature, index) => (
                  <div key={index} className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-all">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Section */}
            <div className="mt-16 bg-gradient-to-r from-blue-600 via-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 md:p-12 text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>
                ZEVA by the Numbers
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold mb-2">5,000+</div>
                  <div className="text-sm md:text-base opacity-90">Clinics Listed</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold mb-2">15,000+</div>
                  <div className="text-sm md:text-base opacity-90">Healthcare Professionals</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold mb-2">200,000+</div>
                  <div className="text-sm md:text-base opacity-90">Appointments Booked</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold mb-2">50+</div>
                  <div className="text-sm md:text-base opacity-90">Cities Covered</div>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="mt-16 bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Ready to Get Started?
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Join thousands of users who trust ZEVA for their healthcare needs. Start your journey to better health today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/clinic/findclinic"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:from-blue-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Find Clinics
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/telemedicine"
                  className="inline-flex items-center gap-2 bg-white border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-full font-semibold hover:bg-blue-50 transition-all"
                >
                  Try Telemedicine
                </Link>
              </div>
            </div>
          </div>
        </div>
    </>
  );
};

export default HowItWorks;

