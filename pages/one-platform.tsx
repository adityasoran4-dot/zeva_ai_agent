import React from "react";
import Head from "next/head";
import Link from "next/link";
import OnePlatformSection from "../components/OnePlatformSection";

const OnePlatformPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>One Platform | ZEVA</title>
        <meta
          name="description"
          content="Everything you need in one platform — explore ZEVA modules for appointments, telemedicine, doctors, clinics, jobs, calculators, and more."
        />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 pt-10">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                One Platform
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Explore everything ZEVA offers—organized in one place.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium"
            >
              Back to home
            </Link>
          </div>
        </div>

        <OnePlatformSection />
      </div>
    </>
  );
};

export default OnePlatformPage;


