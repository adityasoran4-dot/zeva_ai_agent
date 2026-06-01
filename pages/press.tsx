import React from 'react';
import Head from 'next/head';

const Press: React.FC = () => {
  return (
    <>
      <Head>
        <title>Press Kit - ZEVA Healthcare Platform</title>
        <meta
          name="description"
          content="ZEVA press kit, media resources, logos, and press releases. Download media assets and contact our press team."
        />
        <meta name="robots" content="index, follow" />
      </Head>
      <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Press Kit
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Media resources, press releases, and brand assets for journalists and media professionals
              </p>
            </div>

            {/* Press Releases */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Press Releases</h2>
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-gray-500 mb-2">December 2024</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    ZEVA Launches New Telemedicine Platform
                  </h3>
                  <p className="text-gray-600 mb-4">
                    ZEVA announces the launch of its comprehensive telemedicine platform, making healthcare more accessible to users across the region.
                  </p>
                  {/* <button className="text-teal-600 hover:text-teal-700 font-semibold">
                    Read More →
                  </button> */}
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-gray-500 mb-2">November 2024</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    ZEVA Partners with Leading Healthcare Providers
                  </h3>
                  <p className="text-gray-600 mb-4">
                    ZEVA forms strategic partnerships with top healthcare institutions to expand its network of verified clinics and doctors.
                  </p>
                  {/* <button className="text-teal-600 hover:text-teal-700 font-semibold">
                    Read More →
                  </button> */}
                </div>
              </div>
            </div>

            {/* Media Assets */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Media Assets</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                  <div className="w-16 h-16 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🖼️</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Logos</h3>
                  <p className="text-sm text-gray-600 mb-4">Download ZEVA logos in various formats</p>
                  <button className="text-teal-600 hover:text-teal-700 font-semibold text-sm">
                    Download →
                  </button>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                  <div className="w-16 h-16 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📸</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Images</h3>
                  <p className="text-sm text-gray-600 mb-4">High-resolution images and screenshots</p>
                  <button className="text-teal-600 hover:text-teal-700 font-semibold text-sm">
                    Download →
                  </button>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                  <div className="w-16 h-16 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📄</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Brand Guidelines</h3>
                  <p className="text-sm text-gray-600 mb-4">Complete brand style guide</p>
                  <button className="text-teal-600 hover:text-teal-700 font-semibold text-sm">
                    Download →
                  </button>
                </div>
              </div>
            </div>

            {/* Contact Press */}
            <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
                Media Inquiries
              </h2>
              <p className="text-gray-600 text-center mb-6 max-w-2xl mx-auto">
                For press inquiries, interview requests, or media partnerships, please contact our press team.
              </p>
              <div className="text-center">
                <a
                  href=""
                  className="inline-block bg-teal-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-teal-700 transition"
                >
                  Contact Press Team
                </a>
              </div>
            </div>
          </div>
        </div>
    </>
  );
};

export default Press;

