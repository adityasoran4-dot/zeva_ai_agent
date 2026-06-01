import React from "react";
import Head from "next/head";
import Link from "next/link";

const HealthRecordsPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Health Records | ZEVA</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Health Records</h1>
            <p className="text-gray-600 text-sm mt-2 max-w-2xl">
              Secure health records are coming soon. You’ll be able to store and manage
              medical documents in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-teal-800 text-white hover:bg-teal-900 transition-all text-sm font-semibold"
              >
                Back to home
              </Link>
              <Link
                href="/one-platform"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-semibold"
              >
                Explore modules
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HealthRecordsPage;


