import React from "react";
import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";

const BusinessLibraryHeader = () => {
  return (
    <header className="bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">ZEVA Business Library</h1>
              <p className="text-sm text-teal-100">Complete Clinic Workflow Guide</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/clinic/clinic-dashboard" 
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Link 
              href="/clinic/clinic-dashboard" 
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default BusinessLibraryHeader;