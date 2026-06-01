import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AuthModal from '../components/AuthModal';
import {
  Video,
  FileText,
  Lock,
  Clock,
  Stethoscope,
  Shield,
  Smartphone,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Heart,
  MessageSquare,
} from 'lucide-react';

const Telemedicine: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // Just close the modal after successful login, no redirect needed
  };
  const features = [
    {
      icon: <Video className="w-6 h-6" />,
      title: 'Instant Video Consult',
      desc: 'Connect with doctors in minutes via secure video calls',
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Digital Prescriptions',
      desc: 'Get prescriptions instantly delivered to your email',
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: 'Private & Secure',
      desc: 'HIPAA compliant consultations with end-to-end encryption',
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: '24/7 Availability',
      desc: 'Access healthcare professionals anytime, anywhere',
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Easy Scheduling',
      desc: 'Book appointments at your convenience',
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Chat Support',
      desc: 'Get answers to your health questions via chat',
    },
  ];

  const benefits = [
    {
      icon: <Clock className="w-5 h-5" />,
      title: 'Save Time',
      desc: 'No need to travel or wait in queues',
    },
    {
      icon: <Smartphone className="w-5 h-5" />,
      title: 'Convenient',
      desc: 'Consult from the comfort of your home',
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Safe',
      desc: 'Avoid exposure to other patients',
    },
    {
      icon: <Heart className="w-5 h-5" />,
      title: 'Affordable',
      desc: 'Cost-effective healthcare solutions',
    },
  ];

  const specialties = [
    'General Medicine',
    'Pediatrics',
    'Dermatology',
    'Mental Health',
    'Cardiology',
    'Gynecology',
    'Orthopedics',
    'ENT',
  ];

  return (
    <>
      <Head>
        <title>Telemedicine - Online Doctor Consultation | ZEVA Healthcare</title>
        <meta
          name="description"
          content="Get instant access to healthcare professionals through ZEVA telemedicine. Video consultations, digital prescriptions, and 24/7 medical support from verified doctors."
        />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative container mx-auto px-6 py-12 lg:py-20">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-7xl mx-auto">
              {/* Content Side */}
              <div className="text-center lg:text-left z-10">
                <div className="mb-6 flex justify-center lg:justify-start">
                  {/* <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Video className="w-8 h-8 text-white" />
                  </div> */}
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Telemedicine - Healthcare at Your Fingertips
                </h1>
                <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto lg:mx-0" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Connect with verified healthcare professionals instantly through secure video consultations. 
                  Get medical advice, prescriptions, and follow-up care from the comfort of your home.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuthModal(true);
                    }}
                    className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors shadow-lg"
                  >
                    Start Consultation
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <Link
                    href="/doctor/search"
                    className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full font-semibold hover:bg-white/20 transition-colors border border-white/20"
                  >
                    Find Doctors
                  </Link>
                </div>
              </div>

              {/* Image Side */}
              <div className="relative z-10 flex justify-center lg:justify-end">
                <div className="relative w-full max-w-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl blur-2xl"></div>
                  <img
                    src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop&auto=format"
                    alt="Telemedicine - Doctor video consultation"
                    className="relative rounded-3xl shadow-2xl object-cover w-full h-auto"
                    style={{ maxHeight: '500px' }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&h=600&fit=crop&auto=format';
                    }}
                  />
                  {/* Decorative elements */}
                  {/* <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Video className="w-12 h-12 text-white opacity-50" />
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Choose ZEVA Telemedicine?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Comprehensive healthcare solutions designed for modern digital needs
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600">
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
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Benefits of Telemedicine
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="text-center p-6 bg-gray-50 rounded-xl"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                    {benefit.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-600">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 lg:py-24 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                How It Works
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Get started with telemedicine in three simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Book Appointment</h3>
                <p className="text-gray-600">
                  Choose your preferred doctor and schedule a video consultation at your convenience
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Video Consultation</h3>
                <p className="text-gray-600">
                  Connect with your doctor via secure video call and discuss your health concerns
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Prescription</h3>
                <p className="text-gray-600">
                  Receive digital prescription and follow-up care instructions via email
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Available Specialties */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Available Specialties
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Consult with specialists across various medical fields
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {specialties.map((specialty, index) => (
                <div
                  key={index}
                  className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center hover:border-blue-600 hover:shadow-md transition-all"
                >
                  <Stethoscope className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">{specialty}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Coming Soon Notice */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Telemedicine Coming Soon
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                We're working hard to bring you the best telemedicine experience. 
                Video consultations will be available soon. In the meantime, you can search for 
                doctors and book in-person appointments.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/doctor/search"
                  className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                >
                  Search Doctors
                </Link>
                <Link
                  href="/clinic/findclinic"
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-3 rounded-full font-semibold hover:bg-white/20 transition-colors border border-white/20"
                >
                  Find Clinics
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
                <p className="text-gray-600">Verified Doctors</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
                <p className="text-gray-600">Available Support</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">100%</div>
                <p className="text-gray-600">Secure & Private</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authMode}
      />
    </>
  );
};

export default Telemedicine;
