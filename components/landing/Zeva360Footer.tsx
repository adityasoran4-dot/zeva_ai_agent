import React from "react";
import { Shield, MapPin, Award } from "lucide-react";

const Zeva360Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-8 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Trusted By</p>
              <p className="text-sm font-bold text-gray-900">500+ Clinics</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Built for</p>
              <p className="text-sm font-bold text-gray-900">Indian Healthcare</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Security</p>
              <p className="text-sm font-bold text-gray-900">HIPAA Compliant</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gray-200 mb-4"></div>

        {/* Copyright */}
        <div className="text-center text-xs text-gray-600">
          <p>
            © 2026 Zeva360. All rights reserved. |{" "}
            <a href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>{" "}
            |{" "}
            <a href="/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Zeva360Footer;
