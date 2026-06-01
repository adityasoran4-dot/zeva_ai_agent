import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Handshake,
  CheckCircle2,
  TrendingUp,
  Users,
  Award,
  ArrowRight,
  Star,
} from 'lucide-react';

const Partners: React.FC = () => {
  const benefits = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Revenue Sharing',
      desc: 'Earn commissions for referrals and partnerships',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Dedicated Support',
      desc: 'Get dedicated account manager and priority support',
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: 'Marketing Resources',
      desc: 'Access to marketing materials and co-branding opportunities',
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: 'Exclusive Benefits',
      desc: 'Early access to new features and special pricing',
    },
  ];

  const partnerTypes = [
    'Healthcare Providers',
    'Technology Partners',
    'Insurance Companies',
    'Pharmaceutical Companies',
    'Medical Equipment Suppliers',
    'Marketing Agencies',
  ];

  return (
    <>
      <Head>
        <title>Partner Program - Join ZEVA Partnership Network</title>
        <meta
          name="description"
          content="Join ZEVA's partner program and grow together. Revenue sharing, dedicated support, and exclusive benefits for healthcare and technology partners."
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
                <Handshake className="w-16 h-16 mx-auto text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Partner with ZEVA
              </h1>
              <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-3xl mx-auto">
                Join our partner network and grow together. We're looking for healthcare providers, 
                technology companies, and organizations that share our vision of better healthcare.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                >
                  Become a Partner
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full font-semibold hover:bg-white/20 transition-colors border border-white/20"
                >
                  Learn More
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
                Partner Benefits
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Why partner with ZEVA?
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

        {/* Partner Types */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Partner Types
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                We welcome various types of partners
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {partnerTypes.map((type, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-teal-300 transition-colors flex items-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
                  <span className="font-medium text-gray-900">{type}</span>
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
                Ready to Partner with Us?
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Let's work together to transform healthcare. Contact us to discuss partnership opportunities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                >
                  Contact Partnership Team
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Partners;

