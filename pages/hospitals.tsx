import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Building2,
  Users,
  Calendar,
  Shield,
  TrendingUp,
  ArrowRight,
  Stethoscope,
  Activity,
} from 'lucide-react';

const Hospitals: React.FC = () => {
  const features = [
    {
      icon: <Building2 className="w-6 h-6" />,
      title: 'Multi-Department Management',
      desc: 'Manage multiple departments and specialties from one dashboard',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Staff Management',
      desc: 'Organize doctors, nurses, and administrative staff efficiently',
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Advanced Scheduling',
      desc: 'Complex scheduling system for multiple departments and resources',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Enterprise Security',
      desc: 'HIPAA compliant infrastructure for large healthcare organizations',
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: 'Analytics & Reporting',
      desc: 'Comprehensive analytics for operations and patient care',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Scalable Solutions',
      desc: 'Grow from small clinic to large hospital without limitations',
    },
  ];

  const departments = [
    'Emergency',
    'Cardiology',
    'Orthopedics',
    'Pediatrics',
    'Gynecology',
    'Neurology',
    'Oncology',
    'Radiology',
  ];

  return (
    <>
      <Head>
        <title>For Hospitals - Enterprise Healthcare Solutions | ZEVA</title>
        <meta
          name="description"
          content="ZEVA provides comprehensive healthcare management solutions for hospitals. Multi-department management, advanced scheduling, and enterprise-grade security."
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
                Enterprise Solutions for Hospitals
              </h1>
              <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-3xl mx-auto">
                Comprehensive healthcare management platform designed for hospitals and large 
                healthcare organizations. Scale your operations with confidence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                >
                  Request Demo
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/solutions"
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full font-semibold hover:bg-white/20 transition-colors border border-white/20"
                >
                  View Solutions
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Hospital Management Features
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Everything you need to run a modern hospital efficiently
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4 text-teal-600">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Departments Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Multi-Department Support
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Manage all departments from a single platform
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {departments.map((dept, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200 hover:border-teal-300 transition-colors"
                >
                  <Stethoscope className="w-6 h-6 text-teal-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">{dept}</p>
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
                Transform Your Hospital Operations
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Schedule a demo to see how ZEVA can help your hospital deliver better patient care.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                >
                  Schedule Demo
                </Link>
                <Link
                  href="/solutions"
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-3 rounded-full font-semibold hover:bg-white/20 transition-colors border border-white/20"
                >
                  View Features
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Hospitals;

