import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Scale, ArrowLeft, AlertCircle } from 'lucide-react';

const Terms: React.FC = () => {
  const sections = [
    {
      title: 'Acceptance of Terms',
      content: 'By accessing and using ZEVA, you accept and agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.',
    },
    {
      title: 'Use of Service',
      content: [
        'You must be at least 18 years old to use our services',
        'You agree to provide accurate and complete information',
        'You are responsible for maintaining account security',
        'You will not use the service for illegal purposes',
        'You will not interfere with platform operations',
      ],
    },
    {
      title: 'Healthcare Services',
      content: [
        'ZEVA is a platform connecting patients with healthcare providers',
        'We do not provide medical advice or diagnosis',
        'All medical decisions are between you and your healthcare provider',
        'We are not liable for medical outcomes',
        'Emergency situations require immediate professional medical attention',
      ],
    },
    {
      title: 'User Accounts',
      content: [
        'You are responsible for maintaining account confidentiality',
        'You must notify us immediately of unauthorized access',
        'We reserve the right to suspend or terminate accounts',
        'You may not share your account with others',
        'Account information must be kept up to date',
      ],
    },
    {
      title: 'Payment Terms',
      content: [
        'Payment is required for certain services',
        'All fees are non-refundable unless stated otherwise',
        'We accept various payment methods',
        'Prices are subject to change with notice',
        'Refunds are processed according to our Refund Policy',
      ],
    },
    {
      title: 'Intellectual Property',
      content: [
        'All content on ZEVA is protected by copyright',
        'You may not copy, modify, or distribute our content',
        'Trademarks belong to their respective owners',
        'User-generated content remains your property',
        'You grant us license to use your content on the platform',
      ],
    },
    {
      title: 'Limitation of Liability',
      content: [
        'ZEVA is provided "as is" without warranties',
        'We are not liable for indirect or consequential damages',
        'Our liability is limited to the amount you paid',
        'We do not guarantee uninterrupted service',
        'You use the platform at your own risk',
      ],
    },
  ];

  return (
    <>
      <Head>
        <title>Terms of Service - ZEVA Healthcare Platform</title>
        <meta
          name="description"
          content="ZEVA Terms of Service - Read our terms and conditions for using the ZEVA healthcare platform and services."
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
                <Scale className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
                <p className="text-gray-600 mt-1">Last updated: December 2024</p>
              </div>
            </div>
          </div>

          {/* Introduction */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <p className="text-gray-700 leading-relaxed">
              These Terms of Service govern your use of the ZEVA healthcare platform. 
              Please read these terms carefully before using our services.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-6">
            {sections.map((section, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{section.title}</h2>
                {Array.isArray(section.content) ? (
                  <ul className="space-y-2">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-3 text-gray-700">
                        <AlertCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700 leading-relaxed">{section.content}</p>
                )}
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="bg-white rounded-lg shadow-md p-8 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about these Terms, please contact us:
            </p>
            <div className="space-y-2 text-gray-700">
              <p><strong>Email:</strong> legal@zeva360.com</p>
              <p><strong>Phone:</strong> +91 123 456 7890</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Terms;

