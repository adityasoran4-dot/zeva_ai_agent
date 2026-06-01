import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Shield,
  CheckCircle2,
  CreditCard,
  FileText,
  Clock,
  ArrowRight,
  DollarSign,
  Lock,
  AlertCircle,
} from 'lucide-react';

const Insurance: React.FC = () => {
  const insuranceProviders = [
    { name: 'ADNIC', logo: '🏥' },
    { name: 'Daman', logo: '💊' },
    { name: 'Oman Insurance', logo: '🛡️' },
    { name: 'AXA', logo: '🏥' },
    { name: 'MetLife', logo: '💉' },
    { name: 'Allianz', logo: '🏥' },
    { name: 'Bupa', logo: '💊' },
    { name: 'Cigna', logo: '🛡️' },
  ];

  const benefits = [
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: 'Cost Savings',
      desc: 'Reduce out-of-pocket expenses with insurance coverage',
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Easy Claims',
      desc: 'Streamlined claim processing and verification',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Financial Protection',
      desc: 'Protect yourself from unexpected medical costs',
    },
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: 'Wide Network',
      desc: 'Access to extensive network of healthcare providers',
    },
  ];

  const features = [
    {
      icon: <CreditCard className="w-5 h-5" />,
      title: 'Direct Billing',
      desc: 'We bill your insurance directly - no upfront payments',
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: 'Quick Verification',
      desc: 'Instant insurance verification before your visit',
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: 'Secure Processing',
      desc: 'Your insurance data is encrypted and secure',
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: 'Digital Claims',
      desc: 'Submit and track claims online easily',
    },
  ];

  const faqs = [
    {
      question: 'Which insurance providers are accepted?',
      answer: 'We accept major insurance providers including ADNIC, Daman, Oman Insurance, AXA, MetLife, Allianz, Bupa, and Cigna. Contact your clinic to confirm coverage.',
    },
    {
      question: 'How do I verify my insurance coverage?',
      answer: 'You can verify your insurance coverage by contacting the clinic directly or checking your insurance card. Our clinics can verify coverage before your appointment.',
    },
    {
      question: 'Do I need to pay upfront if I have insurance?',
      answer: 'Most clinics offer direct billing to insurance providers. However, you may need to pay co-payments or deductibles as per your insurance plan.',
    },
    {
      question: 'Can I use insurance for telemedicine consultations?',
      answer: 'Insurance coverage for telemedicine varies by provider and plan. Please check with your insurance company or clinic for telemedicine coverage details.',
    },
  ];

  return (
    <>
      <Head>
        <title>Insurance Accepted - Healthcare Insurance Coverage | ZEVA</title>
        <meta
          name="description"
          content="ZEVA accepts major health insurance providers. Find clinics that accept your insurance, verify coverage, and manage claims easily."
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
                    <Shield className="w-8 h-8 text-white" />
                  </div> */}
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Insurance Accepted
                </h1>
                <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto lg:mx-0" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Access quality healthcare with your insurance. We work with major insurance providers 
                  to make healthcare affordable and accessible for everyone.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    href="/clinic/findclinic"
                    className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors shadow-lg"
                  >
                    Find Clinics
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full font-semibold hover:bg-white/20 transition-colors border border-white/20"
                  >
                    Contact Support
                  </Link>
                </div>
              </div>

              {/* Image Side */}
              <div className="relative z-10 flex justify-center lg:justify-end">
                <div className="relative w-full max-w-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl blur-2xl"></div>
                  <img
                    src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop&auto=format"
                    alt="Insurance Accepted - Healthcare Insurance Coverage"
                    className="relative rounded-3xl shadow-2xl object-cover w-full h-auto"
                    style={{ maxHeight: '500px' }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=600&fit=crop&auto=format';
                    }}
                  />
                  {/* Decorative elements */}
                  {/* <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Shield className="w-12 h-12 text-white opacity-50" />
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Insurance Providers Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Accepted Insurance Providers
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                We work with major insurance companies to provide you with seamless healthcare access
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {insuranceProviders.map((provider, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-gray-100 hover:border-blue-200 text-center"
                >
                  <div className="text-4xl mb-3">{provider.logo}</div>
                  <h3 className="font-semibold text-gray-900">{provider.name}</h3>
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
                Benefits of Using Insurance
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center mb-4">
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
        <section className="py-16 lg:py-24 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                How Insurance Works with ZEVA
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Simple steps to use your insurance for healthcare services
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 text-blue-600">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Simple Process
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Check Coverage</h3>
                <p className="text-gray-600">
                  Verify your insurance coverage with the clinic before booking
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Book Appointment</h3>
                <p className="text-gray-600">
                  Schedule your appointment and provide insurance details
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Treatment</h3>
                <p className="text-gray-600">
                  Receive care with direct billing to your insurance provider
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 ml-7">{faq.answer}</p>
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
                Insurance Module Coming Soon
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                We're working on an integrated insurance management system that will allow you to 
                verify coverage, submit claims, and track insurance benefits directly through ZEVA. 
                In the meantime, you can contact clinics directly to confirm insurance acceptance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/clinic/findclinic"
                  className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                >
                  Find Clinics
                </Link>
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

        {/* Stats Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center bg-white rounded-xl p-6 shadow-md">
                <div className="text-4xl font-bold text-blue-600 mb-2">8+</div>
                <p className="text-gray-600">Insurance Providers</p>
              </div>
              <div className="text-center bg-white rounded-xl p-6 shadow-md">
                <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
                <p className="text-gray-600">Partner Clinics</p>
              </div>
              <div className="text-center bg-white rounded-xl p-6 shadow-md">
                <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
                <p className="text-gray-600">Support Available</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Insurance;
