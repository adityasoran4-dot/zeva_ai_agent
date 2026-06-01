import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { AlertTriangle,ArrowLeft, Info } from 'lucide-react';

const Disclaimer: React.FC = () => {
  const disclaimers = [
    {
      title: 'Medical Information',
      content: [
        'ZEVA is a platform connecting patients with healthcare providers',
        'We do not provide medical advice, diagnosis, or treatment',
        'All medical information is for informational purposes only',
        'Always consult qualified healthcare professionals for medical advice',
        'Do not delay seeking medical attention based on information from our platform',
      ],
    },
    {
      title: 'Healthcare Providers',
      content: [
        'We verify healthcare providers but do not guarantee their services',
        'We are not responsible for the quality of care provided',
        'Provider credentials are verified at the time of registration',
        'Patients should verify provider credentials independently',
        'We are not liable for provider actions or medical outcomes',
      ],
    },
    {
      title: 'Platform Availability',
      content: [
        'We strive for 24/7 availability but cannot guarantee uninterrupted service',
        'We are not liable for service interruptions or technical issues',
        'Platform features may change without notice',
        'We reserve the right to modify or discontinue services',
        'Users are responsible for backing up their data',
      ],
    },
    {
      title: 'Third-Party Services',
      content: [
        'Our platform may include links to third-party websites',
        'We are not responsible for third-party content or services',
        'Third-party terms and conditions apply to their services',
        'We do not endorse or guarantee third-party services',
        'Use third-party services at your own risk',
      ],
    },
    {
      title: 'Limitation of Liability',
      content: [
        'ZEVA is provided "as is" without warranties of any kind',
        'We are not liable for indirect, incidental, or consequential damages',
        'Our liability is limited to the maximum extent permitted by law',
        'You use the platform at your own risk',
        'We are not responsible for data loss or security breaches beyond our control',
      ],
    },
  ];

  return (
    <>
      <Head>
        <title>Disclaimer - ZEVA Healthcare Platform</title>
        <meta
          name="description"
          content="ZEVA Disclaimer - Important legal disclaimers regarding medical information, healthcare providers, and platform usage."
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
                <AlertTriangle className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Disclaimer</h1>
                <p className="text-gray-600 mt-1">Important legal information</p>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-yellow-900 mb-2">Important Notice</h3>
                <p className="text-yellow-800 text-sm">
                  Please read this disclaimer carefully. By using ZEVA, you acknowledge that you 
                  have read, understood, and agree to be bound by these disclaimers.
                </p>
              </div>
            </div>
          </div>

          {/* Disclaimers */}
          <div className="space-y-6 mb-8">
            {disclaimers.map((disclaimer, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{disclaimer.title}</h2>
                <ul className="space-y-2">
                  {disclaimer.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-3 text-gray-700">
                      <Info className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Emergency Notice */}
          <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-red-900 mb-2">Medical Emergency</h3>
                <p className="text-red-800 text-sm">
                  If you are experiencing a medical emergency, call emergency services immediately. 
                  Do not use this platform for emergency medical situations.
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions?</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about this disclaimer, please contact us:
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

export default Disclaimer;

