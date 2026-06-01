"use client";
import { useState } from "react";
import { useRouter } from "next/router";
import {
  Link2,
  HelpCircle,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import ClinicLayout from "../../../components/ClinicLayout";
import withClinicAuth from "../../../components/withClinicAuth";
import WhatsAppMarketingSidebar from "../../../components/WhatsAppMarketingSidebar";

const ConnectWABAPage = () => {
  const router = useRouter();
  const [wabaId, setWabaId] = useState("554916260683829");
  const [accessToken, setAccessToken] = useState(
    "EAAUcarGFJCgBPL6cK911KHcloLau7hziT02UDEFluneUeTDUhaPkSn4qPzvlFvS0HZBNTSZA2p9ATI3tElih7RrZBHAS1u2ug8avjB7n"
  );
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleConfigure = async () => {
    setLoading(true);
    try {
      // TODO: Add API call to configure WABA
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsConnected(true);
    } catch (error) {
      console.error("Error configuring WABA:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDebugToken = () => {
    // TODO: Implement debug token functionality
    window.open("https://developers.facebook.com/tools/debug/accesstoken/", "_blank");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="h-screen sticky top-0 z-30">
        <WhatsAppMarketingSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
            {/* Left Panel: WhatsApp Integration Setup */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-purple-600">
                  Step - 1 : WhatsApp Integration Setup
                </h2>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                  Step 1 of 2
                </span>
              </div>

              <div className="space-y-5">
                {/* WABA ID Field */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    Your WhatsApp Business Account (WABA) ID
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-600 transition"
                      title="Your WhatsApp Business Account ID from Meta Business Manager"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </label>
                  <input
                    type="text"
                    value={wabaId}
                    onChange={(e) => setWabaId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    placeholder="Enter your WABA ID"
                  />
                </div>

                {/* Access Token Field */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    Whatsapp Access Token
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-600 transition"
                      title="Permanent access token from Meta Business Manager"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      placeholder="Enter your access token"
                    />
                    <button
                      onClick={handleDebugToken}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center gap-2 text-sm font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      Debug Token
                    </button>
                  </div>
                </div>

                {/* Configure Button */}
                <button
                  onClick={handleConfigure}
                  disabled={loading || !wabaId || !accessToken}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Link2 className="w-5 h-5" />
                  {loading ? "Configuring..." : "Configure"}
                </button>
              </div>
            </div>

            {/* Right Panel: Connection Requirements */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-purple-600 mb-4">
                Connection Requirements
              </h2>

              <p className="text-sm text-gray-600 mb-6">
                You will require the following information to activate your WhatsApp Business Cloud API:
              </p>

              {/* Requirements List */}
              <ol className="space-y-4 mb-6">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-semibold">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Valid Mobile Number</p>
                    <p className="text-sm text-gray-600">A phone number that will be registered on Meta.</p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-semibold">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Facebook Developer Account</p>
                    <p className="text-sm text-gray-600">
                      Register on Facebook for Developers, create a Business App, and add the WhatsApp product.
                    </p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-semibold">
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">WhatsApp Business Profile</p>
                    <p className="text-sm text-gray-600">
                      Add a phone number, verify it, and enable live mode.
                    </p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-semibold">
                    4
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">System User & Access Token</p>
                    <p className="text-sm text-gray-600">
                      Create a system user, assign permissions, and generate a permanent access token.
                    </p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-semibold">
                    5
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Verify Your Setup</p>
                    <p className="text-sm text-gray-600">
                      Use our WhatsApp Cloud API debug tool to check if everything is configured correctly.
                    </p>
                  </div>
                </li>
              </ol>

              {/* Help Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 mb-1">Need Help?</p>
                    <p className="text-sm text-blue-800">
                      For detailed instructions, visit the{" "}
                      <a
                        href="https://developers.facebook.com/docs/whatsapp/cloud-api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-blue-900 font-medium inline-flex items-center gap-1"
                      >
                        WhatsApp Cloud API Documentation
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Connection Status */}
              <div
                className={`rounded-lg p-4 ${
                  isConnected
                    ? "bg-green-50 border border-green-200"
                    : "bg-yellow-50 border border-yellow-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  {isConnected ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={`font-semibold mb-1 ${
                        isConnected ? "text-green-900" : "text-yellow-900"
                      }`}
                    >
                      Connection Status
                    </p>
                    <p
                      className={`text-sm ${
                        isConnected ? "text-green-800" : "text-yellow-800"
                      }`}
                    >
                      {isConnected
                        ? "Your WhatsApp Business API is connected successfully!"
                        : "Your WhatsApp Business API is not connected. Complete the steps above to establish a connection."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Layout
ConnectWABAPage.getLayout = function PageLayout(page) {
  return (
    <ClinicLayout hideSidebar={true} hideHeader={true}>
      {page}
    </ClinicLayout>
  );
};

// Protect and preserve layout
const ProtectedConnectWABAPage = withClinicAuth(ConnectWABAPage);
ProtectedConnectWABAPage.getLayout = ConnectWABAPage.getLayout;

export default ProtectedConnectWABAPage;

