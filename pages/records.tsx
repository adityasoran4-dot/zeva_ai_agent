import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FileText, Shield,Download, Upload } from 'lucide-react';

const Records: React.FC = () => {
  return (
    <>
      <Head>
        <title>Health Records - ZEVA Healthcare Platform</title>
        <meta
          name="description"
          content="Manage your health records securely on ZEVA. Store medical documents, prescriptions, lab reports, and health history in one secure place."
        />
        <meta name="robots" content="index, follow" />
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Health Records
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Secure health records management - Store and manage your medical documents in one place
            </p>
          </div>

          {/* Coming Soon Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 mb-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-teal-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Secure Health Records Coming Soon
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                We're building a comprehensive health records management system that will allow you to securely store, manage, and access all your medical documents in one place.
              </p>
            </div>

            {/* Features Preview */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-6 h-6 text-teal-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Upload Documents</h3>
                <p className="text-sm text-gray-600">
                  Upload prescriptions, lab reports, X-rays, and other medical documents
                </p>
              </div>

              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-teal-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Secure Storage</h3>
                <p className="text-sm text-gray-600">
                  Your health data is encrypted and stored securely with HIPAA compliance
                </p>
              </div>

              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Download className="w-6 h-6 text-teal-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Easy Access</h3>
                <p className="text-sm text-gray-600">
                  Access your records anytime, anywhere, and share with healthcare providers
                </p>
              </div>
            </div>

            {/* What You'll Be Able To Do */}
            <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-l-4 border-blue-600">
              <h3 className="font-bold text-gray-800 text-xl mb-4">What You'll Be Able To Do:</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>Store prescriptions, lab reports, X-rays, and medical certificates</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>Track your medical history and treatment timeline</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>Share records securely with doctors and clinics</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>Set reminders for medication and appointments</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>Export records for offline access</span>
                </li>
              </ul>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link
                href="/clinic/findclinic"
                className="inline-flex items-center justify-center px-6 py-3 bg-teal-600 text-white rounded-md font-semibold hover:bg-teal-700 transition"
              >
                Find Clinics
              </Link>
              <Link
                href="/telemedicine"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 bg-white text-gray-700 rounded-md font-semibold hover:bg-gray-50 transition"
              >
                Explore Telemedicine
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Records;


