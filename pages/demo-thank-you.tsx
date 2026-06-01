"use client";
import React, { useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { CheckCircle2, Clock, ArrowLeft, MessageCircle } from "lucide-react";

const ThankYou: React.FC = () => {
  const router = useRouter();
  const { region = "uae" } = router.query;
  
  // Regional URLs
  const homeUrl = region === "india" 
    ? "/clinic-management-system-india" 
    : "/clinic-management-system-uae";
  
  const whatsappUrl = region === "india" 
    ? "https://wa.me/9650608788" 
    : "https://wa.me/971502983757";

  useEffect(() => {
    // Auto redirect after 10 seconds to correct regional page
    const timer = setTimeout(() => {
      router.push(homeUrl);
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [router, homeUrl]);

  return (
    <>
      <Head>
        <title>Thank You - Demo Request Received | ZEVA 360</title>
        <meta name="description" content="Thank you for requesting a demo. Our team will contact you within 24 hours." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          {/* Success Card */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Top Section */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-8 py-12 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Request Successful!
              </h1>
              <p className="text-blue-100 text-lg">
                Thank you for choosing ZEVA 360
              </p>
            </div>

            {/* Content Section */}
            <div className="px-8 py-10">
              {/* Message */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  We've Received Your Demo Request
                </h2>
                <p className="text-gray-600 text-base leading-relaxed">
                  Our team will contact you within <span className="font-semibold text-blue-600">24 hours</span> to schedule your personalized demo.
                </p>
              </div>

              {/* Timeline */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 mb-8 border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">
                      What Happens Next?
                    </h3>
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold mt-0.5">✓</span>
                        <span>Our team will review your request</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold mt-0.5">✓</span>
                        <span>Contact you within 24 hours via email or phone</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold mt-0.5">✓</span>
                        <span>Schedule a personalized demo at your convenience</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* WhatsApp CTA */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 mb-8 border border-green-200">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-bold text-green-900 text-lg mb-1">
                      Need Immediate Assistance?
                    </h3>
                    <p className="text-green-700 text-sm">
                      Chat with us on WhatsApp for instant support
                    </p>
                  </div>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Back to Home */}
              <div className="text-center">
                <button
                  onClick={() => router.push(homeUrl)}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Home</span>
                </button>
                <p className="text-xs text-gray-500 mt-4">
                  You'll be redirected automatically in a few seconds...
                </p>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>14-Day Free Trial</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ThankYou;
