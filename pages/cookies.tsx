import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Cookie, Settings, ArrowLeft, Info } from 'lucide-react';

const Cookies: React.FC = () => {
  const cookieTypes = [
    {
      name: 'Essential Cookies',
      desc: 'Required for the website to function properly. These cannot be disabled.',
      examples: ['Authentication', 'Security', 'Session management'],
    },
    {
      name: 'Analytics Cookies',
      desc: 'Help us understand how visitors interact with our website.',
      examples: ['Page views', 'User behavior', 'Performance metrics'],
    },
    {
      name: 'Functional Cookies',
      desc: 'Enable enhanced functionality and personalization.',
      examples: ['Language preferences', 'Theme settings', 'User preferences'],
    },
    {
      name: 'Advertising Cookies',
      desc: 'Used to deliver relevant advertisements and track campaign performance.',
      examples: ['Ad targeting', 'Campaign tracking', 'Conversion tracking'],
    },
  ];

  return (
    <>
      <Head>
        <title>Cookie Policy - ZEVA Healthcare Platform</title>
        <meta
          name="description"
          content="ZEVA Cookie Policy - Learn about how we use cookies and similar technologies on our platform."
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
                <Cookie className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Cookie Policy</h1>
                <p className="text-gray-600 mt-1">Last updated: December 2024</p>
              </div>
            </div>
          </div>

          {/* Introduction */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <p className="text-gray-700 leading-relaxed">
              This Cookie Policy explains how ZEVA uses cookies and similar technologies to 
              recognize you when you visit our website. It explains what these technologies are 
              and why we use them, as well as your rights to control our use of them.
            </p>
          </div>

          {/* What are Cookies */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are Cookies?</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Cookies are small text files that are placed on your device when you visit a website. 
              They are widely used to make websites work more efficiently and provide information 
              to the website owners.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We use both session cookies (which expire when you close your browser) and persistent 
              cookies (which stay on your device until they expire or you delete them).
            </p>
          </div>

          {/* Cookie Types */}
          <div className="space-y-6 mb-8">
            {cookieTypes.map((type, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{type.name}</h3>
                <p className="text-gray-700 mb-4">{type.desc}</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Examples:</p>
                  <ul className="space-y-1">
                    {type.examples.map((example, exIndex) => (
                      <li key={exIndex} className="flex items-center gap-2 text-sm text-gray-600">
                        <Info className="w-4 h-4 text-teal-600" />
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Managing Cookies */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Managing Cookies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You can control and manage cookies in various ways. Please keep in mind that removing 
              or blocking cookies can impact your user experience and parts of our website may no 
              longer be fully accessible.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Settings className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Browser Settings</p>
                  <p className="text-gray-600 text-sm">
                    Most browsers allow you to control cookies through their settings. You can set 
                    your browser to refuse cookies or alert you when cookies are being sent.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Settings className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Cookie Preferences</p>
                  <p className="text-gray-600 text-sm">
                    You can manage your cookie preferences through our cookie consent banner when 
                    you first visit our website.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions?</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about our use of cookies, please contact us:
            </p>
            <div className="space-y-2 text-gray-700">
              <p><strong>Email:</strong> privacy@zeva360.com</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Cookies;

