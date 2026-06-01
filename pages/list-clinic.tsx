import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  Users,
  Calendar,
  Shield,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

const ListClinic: React.FC = () => {
  const benefits = [
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Increased Visibility',
      desc: 'Reach thousands of patients searching for healthcare services',
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Online Booking',
      desc: 'Enable patients to book appointments 24/7 through your profile',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Grow Your Practice',
      desc: 'Attract new patients and expand your customer base',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Verified Badge',
      desc: 'Get verified status to build trust with potential patients',
    },
  ];

  const features = [
    'Free clinic listing',
    'Customizable profile page',
    'Appointment management system',
    'Patient reviews and ratings',
    'Analytics dashboard',
    'Marketing tools',
    'Multi-location support',
    'Staff management',
  ];

  const steps = [
    {
      number: '1',
      title: 'Sign Up',
      desc: 'Create your clinic account with basic information',
    },
    {
      number: '2',
      title: 'Complete Profile',
      desc: 'Add clinic details, services, timings, and photos',
    },
    {
      number: '3',
      title: 'Get Verified',
      desc: 'Submit documents for verification and approval',
    },
    {
      number: '4',
      title: 'Go Live',
      desc: 'Start receiving bookings and managing appointments',
    },
  ];

  return (
    <>
      <Head>
        <title>List Your Clinic - Join ZEVA Healthcare Platform</title>
        <meta
          name="description"
          content="List your clinic on ZEVA and reach thousands of patients. Free listing, online booking, and comprehensive clinic management tools."
        />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative container mx-auto px-6 py-20 lg:py-32">
            <div className="max-w-4xl mx-auto text-center">
              <div className="mb-6">
                <Building2 className="w-16 h-16 mx-auto text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                List Your Clinic on ZEVA
              </h1>
              <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-3xl mx-auto">
                Join thousands of healthcare providers on ZEVA. Increase your visibility, 
                attract new patients, and grow your practice with our comprehensive platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/clinic/register-clinic"
                  className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                >
                  Register Your Clinic
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full font-semibold hover:bg-white/20 transition-colors border border-white/20"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why List Your Clinic on ZEVA?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Powerful tools to help your clinic succeed
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4 text-teal-600">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Everything You Need
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 flex items-center gap-3 border border-gray-200 hover:border-teal-300 transition-colors"
                >
                  <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">{feature}</span>
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
                Get started in just 4 simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {steps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Grow Your Practice?
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Join ZEVA today and start reaching more patients. Free to list, no hidden fees.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/clinic/register-clinic"
                  className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-3 rounded-full font-semibold hover:bg-white/20 transition-colors border border-white/20"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default ListClinic;

