import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Shield, Lock, ArrowLeft } from 'lucide-react';

const Privacy: React.FC = () => {
  const sections = [
    {
      title: 'Information We Collect',
      content: [
        'Personal information (name, email, phone number)',
        'Health information and medical records',
        'Payment and billing information',
        'Device and usage information',
        'Location data (with your permission)',
      ],
    },
    {
      title: 'How We Use Your Information',
      content: [
        'To provide healthcare services and appointments',
        'To process payments and insurance claims',
        'To communicate with you about your care',
        'To improve our services and platform',
        'To comply with legal obligations',
      ],
    },
    {
      title: 'Data Security',
      content: [
        'We use industry-standard encryption to protect your data',
        'Access to your information is restricted to authorized personnel',
        'Regular security audits and updates',
        'HIPAA compliant infrastructure',
        'Secure data centers with physical security measures',
      ],
    },
    {
      title: 'Your Rights',
      content: [
        'Access your personal information',
        'Request corrections to your data',
        'Request deletion of your data',
        'Opt-out of marketing communications',
        'Request data portability',
      ],
    },
    {
      title: 'Data Sharing',
      content: [
        'We do not sell your personal information',
        'We share data only with your consent or as required by law',
        'Healthcare providers may access your records for treatment',
        'Third-party service providers under strict agreements',
        'Legal authorities when required by law',
      ],
    },
    {
      title: 'Cookies and Tracking',
      content: [
        'We use cookies to improve your experience',
        'You can control cookie preferences in your browser',
        'We use analytics to understand platform usage',
        'Third-party cookies may be used for advertising',
        'See our Cookie Policy for more details',
      ],
    },
  ];

  return (
    <>
      <Head>
        <title>Privacy Policy - ZEVA Healthcare Platform</title>
        <meta
          name="description"
          content="ZEVA Privacy Policy - Learn how we collect, use, and protect your personal and health information. HIPAA compliant data protection."
        />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
                <p className="text-gray-600 mt-1">Last updated: December 2024</p>
              </div>
            </div>
          </div>

          {/* Introduction */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <p className="text-gray-700 leading-relaxed">
              At ZEVA, we are committed to protecting your privacy and ensuring the security of your 
              personal and health information. This Privacy Policy explains how we collect, use, 
              disclose, and safeguard your information when you use our healthcare platform.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-6">
            {sections.map((section, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{section.title}</h2>
                <ul className="space-y-2">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-3 text-gray-700">
                      <Lock className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="bg-white rounded-lg shadow-md p-8 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about this Privacy Policy or wish to exercise your rights, 
              please contact us:
            </p>
            <div className="space-y-2 text-gray-700">
              <p><strong>Email:</strong> privacy@zeva360.com</p>
              <p><strong>Phone:</strong> +91 123 456 7890</p>
              <p><strong>Address:</strong> ZEVA Healthcare, Healthcare Technology Hub, India</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Privacy;

