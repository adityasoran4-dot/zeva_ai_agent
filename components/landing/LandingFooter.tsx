import React from "react";
import Link from "next/link";


const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-gradient-to-b from-[#0b2b4a] to-[#0a2040] text-white mt-16">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            
            
          </div>

          {/* Product */}
          <div>
           
          </div>

          {/* Company */}
          <div>
           
          </div>

          {/* Contact */}
         
        </div>

        <div className="border-t border-blue-900/40 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-blue-200">
          <span>© 2026 Zeva Clinic Management. All rights reserved.</span>
          <div className="flex items-center gap-4 mt-3 md:mt-0">
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white">Terms of Service</Link>
            <Link href="/cookies" className="hover:text-white">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
