import React from "react";
import { MessageCircle, Play, Shield, Clock, XCircle } from "lucide-react";

interface Zeva360FinalCTAProps {
  whatsappUrl?: string;
  whatsappNumber?: string;
  homeUrl?: string;
}

const Zeva360FinalCTA: React.FC<Zeva360FinalCTAProps> = ({
  whatsappUrl,
  whatsappNumber = "971502983757",
  homeUrl = "/clinic-management-system-uae",
}) => {
  // Use provided whatsappUrl or construct it from whatsappNumber
  const finalWhatsappUrl = whatsappUrl || `https://wa.me/${whatsappNumber}`;
  const openDemoPopup = () => {
    window.dispatchEvent(new CustomEvent("zeva:open-demo-popup"));
  };

  return (
    <section className="py-16 relative overflow-hidden bg-gradient-to-br from-[#1565D8] via-[#0B3E91] to-[#1565D8] text-white px-6 sm:px-12 lg:px-20 py-16 sm:py-20">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <a href={homeUrl} className="inline-block text-3xl md:text-4xl font-bold mb-3 hover:text-blue-200 transition-colors">
          Start Growing Your Clinic Today!
        </a>
        <p className="text-sm text-blue-200 mb-8">
          14-Day Free Trial. No Credit Card Required
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <button onClick={openDemoPopup} className="inline-flex items-center gap-2 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all shadow-lg">
            <Play className="w-4 h-4" />
            <span>Book Free Demo</span>
          </button>
          <a
            href={finalWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-all shadow-lg"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-white/20 mb-6"></div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-200" />
            <span className="text-blue-100">No Setup Fee</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-blue-200" />
            <span className="text-blue-100">Cancel Anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-200" />
            <span className="text-blue-100">24/7 Support</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Zeva360FinalCTA;
