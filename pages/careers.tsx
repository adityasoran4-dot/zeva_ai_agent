import React from 'react';
import Head from 'next/head';
import Career from '../components/Career';
import Link from 'next/link';

const Careers: React.FC = () => {
  return (
    <>
      <Head>
        <title>Careers - ZEVA Healthcare Platform</title>
        <meta
          name="description"
          content="Join ZEVA and build your career in healthcare. Explore job opportunities in medical, technology, and healthcare management."
        />
        <meta name="robots" content="index, follow" />
      </Head>
      <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Careers at ZEVA
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Join us in revolutionizing healthcare. Explore exciting career opportunities and grow with us.
              </p>
            </div>

            {/* Career Component */}
            <div className="mb-16">
              <Career />
            </div>

            {/* Why Work at ZEVA */}
            <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                Why Work at ZEVA?
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">💼</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Growth Opportunities</h4>
                    <p className="text-gray-600">Advance your career with continuous learning and development programs</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🤝</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Collaborative Culture</h4>
                    <p className="text-gray-600">Work with talented professionals in a supportive environment</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">⚖️</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Work-Life Balance</h4>
                    <p className="text-gray-600">Flexible working hours and remote work options</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Impactful Work</h4>
                    <p className="text-gray-600">Make a difference in healthcare and improve lives</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center">
              <Link href="/job-listings">
                <button className="bg-teal-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-teal-700 transition text-lg">
                  View All Job Openings
                </button>
              </Link>
            </div>
          </div>
        </div>
    </>
  );
};

export default Careers;

