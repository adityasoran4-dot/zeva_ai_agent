import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Code,
  Shield,
  Zap,
  Book,
  ArrowRight,
  Key,
  Globe,
  Settings,
} from 'lucide-react';

const API: React.FC = () => {
  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'RESTful API',
      desc: 'Modern REST API with comprehensive documentation',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Secure Authentication',
      desc: 'OAuth 2.0 and API key authentication',
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Webhooks',
      desc: 'Real-time event notifications via webhooks',
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: 'Easy Integration',
      desc: 'Simple integration with your existing systems',
    },
  ];

  const endpoints = [
    'Appointments API',
    'Patients API',
    'Clinics API',
    'Doctors API',
    'Billing API',
    'Analytics API',
  ];

  return (
    <>
      <Head>
        <title>API & Integration - Developer Resources | ZEVA</title>
        <meta
          name="description"
          content="ZEVA API documentation and integration guides. Build custom healthcare solutions with our RESTful API, webhooks, and developer tools."
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
                <Code className="w-16 h-16 mx-auto text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                API & Integration
              </h1>
              <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-3xl mx-auto">
                Build custom healthcare solutions with ZEVA's powerful API. 
                Integrate seamlessly with your existing systems and workflows.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="#"
                  className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                >
                  View Documentation
                  <ArrowRight className="w-5 h-5" />
                </a>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full font-semibold hover:bg-white/20 transition-colors border border-white/20"
                >
                  Get API Key
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
                Powerful API Features
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Everything you need to build and integrate healthcare solutions
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* API Endpoints */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Available API Endpoints
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {endpoints.map((endpoint, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-teal-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-teal-600" />
                    <span className="font-medium text-gray-900">{endpoint}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Documentation CTA */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <Book className="w-16 h-16 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Comprehensive Documentation
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Get started quickly with our detailed API documentation, code examples, and integration guides.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="#"
                  className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                >
                  Read Docs
                </a>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-3 rounded-full font-semibold hover:bg-white/20 transition-colors border border-white/20"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default API;

