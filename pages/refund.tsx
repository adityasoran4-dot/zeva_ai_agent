import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { DollarSign,CheckCircle2, ArrowLeft} from 'lucide-react';

const Refund: React.FC = () => {
  const refundPolicy = [
    {
      title: 'Appointment Cancellations',
      content: [
        'Cancellations made 24 hours before appointment: Full refund',
        'Cancellations made less than 24 hours: 50% refund',
        'No-show appointments: No refund',
        'Refunds processed within 5-7 business days',
      ],
    },
    {
      title: 'Subscription Services',
      content: [
        'Monthly subscriptions: Cancel anytime, no refund for current month',
        'Annual subscriptions: Pro-rated refund for unused months',
        'Refund requests must be made within 30 days of purchase',
        'Processing time: 7-10 business days',
      ],
    },
    {
      title: 'Service Issues',
      content: [
        'If service is not delivered as promised: Full refund',
        'Technical issues preventing service use: Full or partial refund',
        'Duplicate charges: Immediate refund',
        'Contact support within 7 days of issue',
      ],
    },
    {
      title: 'Non-Refundable Items',
      content: [
        'Completed consultations and services',
        'Processing fees',
        'Third-party service charges',
        'Gift cards and promotional credits',
      ],
    },
  ];

  return (
    <>
      <Head>
        <title>Refund Policy - ZEVA Healthcare Platform</title>
        <meta
          name="description"
          content="ZEVA Refund Policy - Learn about our refund and cancellation policies for appointments, subscriptions, and services."
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
                <DollarSign className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Refund Policy</h1>
                <p className="text-gray-600 mt-1">Last updated: December 2024</p>
              </div>
            </div>
          </div>

          {/* Introduction */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <p className="text-gray-700 leading-relaxed">
              At ZEVA, we strive to provide excellent service. This Refund Policy outlines the 
              circumstances under which refunds may be issued and the process for requesting a refund.
            </p>
          </div>

          {/* Refund Policies */}
          <div className="space-y-6 mb-8">
            {refundPolicy.map((policy, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{policy.title}</h2>
                <ul className="space-y-2">
                  {policy.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-3 text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Refund Process */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Refund Process</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Request Refund</p>
                  <p className="text-gray-600 text-sm">
                    Contact our support team via email or phone with your order details
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Review</p>
                  <p className="text-gray-600 text-sm">
                    We review your request and verify eligibility within 2-3 business days
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Processing</p>
                  <p className="text-gray-600 text-sm">
                    Approved refunds are processed and credited to your original payment method
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Help?</h2>
            <p className="text-gray-700 mb-4">
              For refund requests or questions, please contact us:
            </p>
            <div className="space-y-2 text-gray-700">
              <p><strong>Email:</strong> support@zeva360.com</p>
              <p><strong>Phone:</strong> +91 123 456 7890</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Refund;

