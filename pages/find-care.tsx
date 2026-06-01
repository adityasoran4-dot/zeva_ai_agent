import React from "react";
import Head from "next/head";
import Link from "next/link";

const FindCarePage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Find Clinics & Doctors | ZEVA</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Find Clinics & Doctors
            </h1>
            <p className="text-gray-600 text-sm mt-2 max-w-2xl">
              Choose what you want to explore—verified clinics or doctors with smart filters.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <Link
                href="/clinic/findclinic"
                className="rounded-2xl border border-gray-200 bg-white p-6 hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                <div className="text-gray-900 font-semibold">Explore clinics</div>
                <div className="text-gray-600 text-sm mt-1">
                  Browse clinics and view verified profiles.
                </div>
              </Link>

              <Link
                href="/doctor/search"
                className="rounded-2xl border border-gray-200 bg-white p-6 hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                <div className="text-gray-900 font-semibold">Search doctors</div>
                <div className="text-gray-600 text-sm mt-1">
                  Find doctors with specialties, location, and more.
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FindCarePage;


