import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Briefcase,
  CheckCircle2,
  Users,
  Calendar,
  ArrowRight,
  BarChart3,
  CreditCard,
  FileText,
  Smartphone,
} from 'lucide-react';

const Solutions: React.FC = () => {
  const solutions = [
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Appointment Management',
      desc: 'Streamline scheduling with automated reminders and calendar integration',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Patient Management',
      desc: 'Complete patient records, history, and communication tools',
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: 'Billing & Payments',
      desc: 'Automated invoicing, payment processing, and insurance claims',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Analytics & Reports',
      desc: 'Comprehensive insights into your practice performance',
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Document Management',
      desc: 'Secure storage and management of medical records',
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: 'Mobile Access',
      desc: 'Manage your practice on-the-go with mobile apps',
    },
  ];

  const industries = [
    'Private Clinics',
    'Hospitals',
    'Dental Practices',
    'Wellness Centers',
    'Specialty Clinics',
    'Multi-Location Practices',
  ];

  return (
    <>
      <Head>
        <title>Business Solutions - Healthcare Management Platform | ZEVA</title>
        <meta
          name="description"
          content="Comprehensive healthcare business solutions for clinics, hospitals, and medical practices. Appointment management, patient records, billing, and more."
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
                <Briefcase className="w-16 h-16 mx-auto text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Business Solutions for Healthcare
              </h1>
              <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-3xl mx-auto">
                Complete healthcare management platform designed to streamline operations, 
                improve patient care, and grow your practice.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full font-semibold hover:bg-white/20 transition-colors border border-white/20"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Solutions Grid */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Complete Healthcare Solutions
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Everything you need to run a successful healthcare practice
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {solutions.map((solution, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4 text-teal-600">
                    {solution.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{solution.title}</h3>
                  <p className="text-gray-600">{solution.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Industries Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Perfect for Every Healthcare Business
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {industries.map((industry, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200 hover:border-teal-300 transition-colors"
                >
                  <CheckCircle2 className="w-6 h-6 text-teal-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">{industry}</p>
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
                Ready to Transform Your Practice?
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Join thousands of healthcare providers using ZEVA to deliver better patient care.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                >
                  Contact Sales
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-3 rounded-full font-semibold hover:bg-white/20 transition-colors border border-white/20"
                >
                  View Plans
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Solutions;

