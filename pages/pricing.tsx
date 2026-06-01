import React from 'react';
import Head from 'next/head';

const Pricing: React.FC = () => {
  return (
    <>
      <Head>
        <title>Pricing - ZEVA Healthcare Platform</title>
        <meta
          name="description"
          content="View ZEVA pricing plans for users and businesses. Find the right plan for your healthcare needs."
        />
        <meta name="robots" content="index, follow" />
      </Head>
      <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Pricing Plans
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Choose the plan that works best for you
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mt-12">
              {/* Free Plan */}
              <div className="bg-white rounded-lg shadow-md p-8 border-2 border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">₹0</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-1">✓</span>
                    <span className="text-gray-600">Search clinics & doctors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-1">✓</span>
                    <span className="text-gray-600">Book appointments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-1">✓</span>
                    <span className="text-gray-600">Basic health records</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-1">✓</span>
                    <span className="text-gray-600">Health calculators</span>
                  </li>
                </ul>
                {/* <button className="w-full bg-gray-200 text-gray-800 py-3 rounded-md font-semibold hover:bg-gray-300 transition">
                
                </button> */}
              </div>

              {/* Premium Plan */}
              <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-teal-500 relative">
                <div className="absolute top-0 right-0 bg-teal-500 text-white px-4 py-1 rounded-bl-lg text-sm font-semibold">
                  Popular
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">₹499</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-1">✓</span>
                    <span className="text-gray-600">Everything in Free</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-1">✓</span>
                    <span className="text-gray-600">Unlimited appointments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-1">✓</span>
                    <span className="text-gray-600">Advanced health records</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-1">✓</span>
                    <span className="text-gray-600">Telemedicine access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-1">✓</span>
                    <span className="text-gray-600">Priority support</span>
                  </li>
                </ul>
              <button className="w-full bg-gray-200 text-gray-800 py-3 rounded-md font-semibold hover:bg-gray-300 transition">
                  Coming soon  
                </button>
              </div>

              {/* Business Plan */}
              <div className="bg-white rounded-lg shadow-md p-8 border-2 border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Business</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">Custom</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-1">✓</span>
                    <span className="text-gray-600">Everything in Premium</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-1">✓</span>
                    <span className="text-gray-600">Clinic management tools</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-1">✓</span>
                    <span className="text-gray-600">API access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-1">✓</span>
                    <span className="text-gray-600">Custom integrations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-1">✓</span>
                    <span className="text-gray-600">Dedicated support</span>
                  </li>
                </ul>
                {/* <button className="w-full bg-gray-200 text-gray-800 py-3 rounded-md font-semibold hover:bg-gray-300 transition">
                  Contact Sales
                </button> */}
              </div>
            </div>

            <div className="mt-16 text-center">
              <p className="text-gray-600 mb-4">
                All plans include secure data storage and 24/7 platform access
              </p>
              <p className="text-sm text-gray-500">
                * Pricing may vary. Contact us for more details.
              </p>
            </div>
          </div>
        </div>
    </>
  );
};

export default Pricing;

