import React from "react";
import Head from "next/head";
import { CheckCircle } from "lucide-react";

const ConsentSuccessPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Consent Submitted | Zeva360</title>
        <meta name="description" content="Your consent form has been submitted successfully" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-8 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Consent Submitted Successfully!
            </h1>

            {/* Message */}
            <p className="text-gray-600 mb-8">
              Thank you for completing your consent form. Your response has been recorded and will be reviewed by our medical team.
            </p>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
              <p className="text-sm text-blue-800">
                A copy of your consent form has been saved to your medical records and is available for download at any time.
              </p>
            </div>

            {/* Additional Info */}
            <div className="text-left bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">What happens next?</h3>
              <ul className="text-xs text-gray-600 space-y-1.5">
                <li>• Our medical team will review your consent</li>
                <li>• You'll receive a confirmation via WhatsApp or SMS</li>
                <li>• The consent will be available in your patient portal</li>
                <li>• You can access it anytime before your appointment</li>
              </ul>
            </div>

            {/* Contact Info */}
            <p className="text-xs text-gray-500">
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConsentSuccessPage;
