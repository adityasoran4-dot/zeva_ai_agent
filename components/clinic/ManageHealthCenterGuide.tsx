"use client";
import React from 'react';
import { Briefcase } from 'lucide-react';

interface ManageHealthCenterGuideProps {
  selectedSubItem?: string | null;
}

const ManageHealthCenterGuide: React.FC<ManageHealthCenterGuideProps> = () => {
  // Always show the full Manage Health Center content
  // selectedSubItem is used for future enhancements but main content stays the same
  
  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex items-center gap-3 mb-8">
        <Briefcase className="w-10 h-10 text-teal-600" />
        <h2 className="text-3xl font-bold text-gray-900">Business Management</h2>
      </div>
      
      {/* Always show the full Manage Health Center content */}
      <div className="prose max-w-none">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Manage Health Center - Complete Guide</h3>
        <p className="text-base text-gray-600 mb-8 leading-relaxed">
          The Manage Health Center module allows you to configure and manage all aspects of your clinic's profile, 
          from basic information to multi-branch operations. This comprehensive guide covers all six sections in detail.
        </p>
        
        {/* General Info Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-8 mb-10 rounded-r-lg">
          <h4 className="font-bold text-lg text-blue-900 mb-5 flex items-center gap-2">
            <span className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full text-base font-bold">1</span>
            General Information
          </h4>
          <div className="ml-12 space-y-4">
            <p className="text-base text-blue-800 leading-relaxed">
              The General Info section contains all essential clinic information that defines your healthcare facility's identity:
            </p>
            <ul className="list-disc list-inside space-y-3 text-base text-blue-700">
              <li><strong>Clinic Name:</strong> Your official clinic/facility name (e.g., "Zeva Health Center")</li>
              <li><strong>Username/Slug:</strong> Unique identifier for your clinic profile URL (e.g., zeva.com/zeva-health)</li>
              <li><strong>Consultation Fee:</strong> Standard consultation charges in AED (e.g., 200 AED)</li>
              <li><strong>Tagline:</strong> A brief, catchy phrase describing your clinic's mission or specialty</li>
              <li><strong>Description:</strong> Detailed information about your clinic, services, and approach to patient care</li>
              <li><strong>Logo Upload:</strong> Your clinic's primary branding image (recommended: 500x500px, PNG/JPG format)</li>
              <li><strong>Cover Image:</strong> Large banner image showcasing your facility (recommended: 1920x600px)</li>
              <li><strong>Treatment Selection:</strong> Choose and categorize the medical treatments and services you offer</li>
              <li><strong>Service Management:</strong> Define and organize your clinic's service portfolio</li>
            </ul>
            
            {/* Image Section */}
            <div className="w-full bg-blue-50 rounded-xl border border-blue-200 p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                General Information
              </h3>
              <div className="bg-white rounded-lg border-2 border-blue-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                <img 
                  src="/manage.png" 
                  alt="General Info Screen" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.querySelector('.placeholder-general')?.classList.remove('hidden');
                  }}
                />
                <div className="placeholder-general hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-500">
                  <Briefcase className="w-16 h-16 mb-4 text-blue-300" />
                  <p className="text-lg font-medium">General Information Interface</p>
                  <p className="text-sm mt-2">Screenshot will appear here</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700"><strong>💡 Pro Tip:</strong> Keep your clinic information up-to-date and use high-quality images for better patient engagement.</p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-8 mb-10 rounded-r-lg">
          <h4 className="font-bold text-lg text-green-900 mb-5 flex items-center gap-2">
            <span className="flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-full text-base font-bold">2</span>
            Contact Information
          </h4>
          <div className="ml-12 space-y-4">
            <p className="text-base text-green-800 leading-relaxed">
              The Contact section manages all communication channels patients use to reach your clinic:
            </p>
            <ul className="list-disc list-inside space-y-3 text-base text-green-700">
              <li><strong>Phone Number:</strong> Primary clinic contact number for appointments and inquiries</li>
              <li><strong>WhatsApp Number:</strong> Dedicated WhatsApp line for quick patient communication</li>
              <li><strong>Email Address:</strong> Official clinic email for correspondence and documentation</li>
              <li><strong>Website:</strong> Your clinic's external website URL (if applicable)</li>
              <li><strong>Physical Address:</strong> Complete street address including building, floor, and area</li>
              <li><strong>City/Emirate:</strong> City location (e.g., Dubai, Abu Dhabi, Sharjah)</li>
              <li><strong>Landmark:</strong> Nearby landmark or point of interest for easier navigation</li>
            </ul>
            
            {/* Image Section */}
            <div className="w-full bg-green-50 rounded-xl border border-green-200 p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Contact Information
              </h3>
              <div className="bg-white rounded-lg border-2 border-green-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                <img 
                  src="/contact.png" 
                  alt="Contact Info Screen" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.querySelector('.placeholder-contact')?.classList.remove('hidden');
                  }}
                />
                <div className="placeholder-contact hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 text-gray-500">
                  <Briefcase className="w-16 h-16 mb-4 text-green-300" />
                  <p className="text-lg font-medium">Contact Information Interface</p>
                  <p className="text-sm mt-2">Screenshot will appear here</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
              <p className="text-sm text-green-700"><strong>✓ Best Practice:</strong> Verify all contact details regularly to ensure patients can always reach you.</p>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-gradient-to-r from-purple-50 to-violet-50 border-l-4 border-purple-500 p-8 mb-10 rounded-r-lg">
          <h4 className="font-bold text-lg text-purple-900 mb-5 flex items-center gap-2">
            <span className="flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-full text-base font-bold">3</span>
            Documents Management
          </h4>
          <div className="ml-12 space-y-4">
            <p className="text-base text-purple-800 leading-relaxed">
              The Documents section handles all official paperwork, certifications, and regulatory compliance files:
            </p>
            <ul className="list-disc list-inside space-y-3 text-base text-purple-700">
              <li><strong>Upload New Documents:</strong> Add certificates, licenses, insurance documents, and compliance papers</li>
              <li><strong>Document Categories:</strong> Organize by type (Medical Licenses, Insurance, Certifications, Policies)</li>
              <li><strong>View Existing Documents:</strong> Access previously uploaded files with preview functionality</li>
              <li><strong>Document Validation:</strong> Track expiry dates and renewal requirements for time-sensitive documents</li>
              <li><strong>File Format Support:</strong> PDF, JPG, PNG formats accepted (max file size: 10MB)</li>
              <li><strong>Version Control:</strong> Maintain document history and update old versions</li>
            </ul>
            
            {/* Image Section */}
            <div className="w-full bg-purple-50 rounded-xl border border-purple-200 p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Documents Management
              </h3>
              <div className="bg-white rounded-lg border-2 border-purple-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                <img 
                  src="/doc.png" 
                  alt="Documents Screen" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.querySelector('.placeholder-docs')?.classList.remove('hidden');
                  }}
                />
                <div className="placeholder-docs hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-violet-50 text-gray-500">
                  <Briefcase className="w-16 h-16 mb-4 text-purple-300" />
                  <p className="text-lg font-medium">Documents Management Interface</p>
                  <p className="text-sm mt-2">Screenshot will appear here</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <h5 className="font-semibold text-purple-900 mb-2 text-base">Required Documents:</h5>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• DHA/DOH Medical License</li>
                  <li>• Trade License</li>
                  <li>• Malpractice Insurance</li>
                  <li>• Radiation Permit (if applicable)</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <h5 className="font-semibold text-purple-900 mb-2 text-base">Optional Documents:</h5>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• ISO Certifications</li>
                  <li>• Awards & Recognition</li>
                  <li>• Partnership Agreements</li>
                  <li>• Patient Testimonials</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Listing Section */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 p-8 mb-10 rounded-r-lg">
          <h4 className="font-bold text-lg text-orange-900 mb-5 flex items-center gap-2">
            <span className="flex items-center justify-center w-10 h-10 bg-orange-600 text-white rounded-full text-base font-bold">4</span>
            Listing & Visibility Settings
          </h4>
          <div className="ml-12 space-y-4">
            <p className="text-base text-orange-800 leading-relaxed">
              The Listing section controls what information appears on your public profile through toggle switches:
            </p>
            <ul className="list-disc list-inside space-y-3 text-base text-orange-700">
              <li><strong>Show Services:</strong> Toggle ON to display your clinic's services list publicly</li>
              <li><strong>Show Prices:</strong> Toggle ON to make consultation fees and treatment prices visible</li>
              <li><strong>Show Staff:</strong> Toggle ON to display doctor and staff profiles</li>
              <li><strong>Show Reviews:</strong> Toggle ON to allow patient reviews and ratings to be visible</li>
              <li><strong>Show Photos:</strong> Toggle ON to display clinic images and facility photos</li>
              <li><strong>Show Timings:</strong> Toggle ON to make operating hours visible to patients</li>
            </ul>
            
            {/* Image Section */}
            <div className="w-full bg-orange-50 rounded-xl border border-orange-200 p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Listing & Visibility Settings
              </h3>
              <div className="bg-white rounded-lg border-2 border-orange-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                <img 
                  src="/listing.png" 
                  alt="Listing Settings Screen" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.querySelector('.placeholder-listing')?.classList.remove('hidden');
                  }}
                />
                <div className="placeholder-listing hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 text-gray-500">
                  <Briefcase className="w-16 h-16 mb-4 text-orange-300" />
                  <p className="text-lg font-medium">Listing & Visibility Interface</p>
                  <p className="text-sm mt-2">Screenshot will appear here</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-white rounded-lg border border-orange-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-orange-800 font-semibold">Important:</p>
                  <p className="text-sm text-orange-700 mt-1">
                    Only toggled-ON items will be visible on your public profile. Toggled-OFF items remain hidden even after saving. 
                    This gives you complete control over your clinic's public presentation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clinic Timing Section */}
        <div className="bg-gradient-to-r from-cyan-50 to-sky-50 border-l-4 border-cyan-500 p-8 mb-10 rounded-r-lg">
          <h4 className="font-bold text-lg text-cyan-900 mb-5 flex items-center gap-2">
            <span className="flex items-center justify-center w-10 h-10 bg-cyan-600 text-white rounded-full text-base font-bold">5</span>
            Clinic Timing & Availability
          </h4>
          <div className="ml-12 space-y-4">
            <p className="text-base text-cyan-800 leading-relaxed">
              The Clinic Timing section defines when your clinic operates and accepts appointments:
            </p>
            <ul className="list-disc list-inside space-y-3 text-base text-cyan-700">
              <li><strong>Working Days:</strong> Select which days your clinic operates (Sunday-Saturday)</li>
              <li><strong>Opening Time:</strong> Daily clinic opening hour (e.g., 09:00 AM)</li>
              <li><strong>Closing Time:</strong> Daily clinic closing hour (e.g., 09:00 PM)</li>
              <li><strong>Appointment Duration:</strong> Standard consultation slot length (e.g., 15, 30, 60 minutes)</li>
              <li><strong>Break Times:</strong> Define lunch breaks or non-operational periods during the day</li>
              <li><strong>Emergency Hours:</strong> Special timings for emergency services (if applicable)</li>
              <li><strong>Holiday Schedule:</strong> Mark closed dates and special holiday hours</li>
            </ul>
            
            {/* Image Section */}
            <div className="w-full bg-cyan-50 rounded-xl border border-cyan-200 p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Clinic Timing & Availability
              </h3>
              <div className="bg-white rounded-lg border-2 border-cyan-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                <img 
                  src="/time.png" 
                  alt="Clinic Timing Screen" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.querySelector('.placeholder-timing')?.classList.remove('hidden');
                  }}
                />
                <div className="placeholder-timing hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 to-sky-50 text-gray-500">
                  <Briefcase className="w-16 h-16 mb-4 text-cyan-300" />
                  <p className="text-lg font-medium">Clinic Timing Interface</p>
                  <p className="text-sm mt-2">Screenshot will appear here</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-cyan-200">
                <h5 className="font-semibold text-cyan-900 mb-2 text-base">Regular Hours Example:</h5>
                <ul className="text-sm text-cyan-700 space-y-1">
                  <li>• Sunday-Thursday: 9:00 AM - 9:00 PM</li>
                  <li>• Friday: 2:00 PM - 9:00 PM</li>
                  <li>• Saturday: 9:00 AM - 6:00 PM</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg border border-cyan-200">
                <h5 className="font-semibold text-cyan-900 mb-2 text-base">Slot Configuration:</h5>
                <ul className="text-sm text-cyan-700 space-y-1">
                  <li>• Standard: 30 min slots</li>
                  <li>• Follow-up: 15 min slots</li>
                  <li>• Procedures: 60 min slots</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Branches Section */}
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 border-l-4 border-rose-500 p-8 mb-10 rounded-r-lg">
          <h4 className="font-bold text-lg text-rose-900 mb-5 flex items-center gap-2">
            <span className="flex items-center justify-center w-10 h-10 bg-rose-600 text-white rounded-full text-base font-bold">6</span>
            Branches & Locations
          </h4>
          <div className="ml-12 space-y-4">
            <p className="text-base text-rose-800 leading-relaxed">
              The Branches section manages multiple clinic locations and facilities under one organization:
            </p>
            <ul className="list-disc list-inside space-y-3 text-base text-rose-700">
              <li><strong>Add Multiple Branches:</strong> Create separate profiles for each clinic location</li>
              <li><strong>Branch-Specific Info:</strong> Individual contact details, timings, and services per branch</li>
              <li><strong>Location Mapping:</strong> GPS coordinates and Google Maps integration for each branch</li>
              <li><strong>Branch Manager Assignment:</strong> Designate specific staff to manage individual branches</li>
              <li><strong>Unified Branding:</strong> Maintain consistent logo and branding across all branches</li>
              <li><strong>Centralized Reporting:</strong> View consolidated analytics across all locations</li>
              <li><strong>Branch Activation:</strong> Toggle branches active/inactive based on operational status</li>
            </ul>
            
            {/* Image Section */}
            <div className="w-full bg-rose-50 rounded-xl border border-rose-200 p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Branches & Locations
              </h3>
              <div className="bg-white rounded-lg border-2 border-rose-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                <img 
                  src="/branches.png" 
                  alt="Branches Screen" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.querySelector('.placeholder-branches')?.classList.remove('hidden');
                  }}
                />
                <div className="placeholder-branches hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50 text-gray-500">
                  <Briefcase className="w-16 h-16 mb-4 text-rose-300" />
                  <p className="text-lg font-medium">Branches & Locations Interface</p>
                  <p className="text-sm mt-2">Screenshot will appear here</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-white rounded-lg border border-rose-200">
              <h5 className="font-semibold text-rose-900 mb-2 text-base">Multi-Branch Benefits:</h5>
              <ul className="text-sm text-rose-700 space-y-1">
                <li>✓ Expand your clinic's geographic reach</li>
                <li>✓ Serve patients in multiple areas</li>
                <li>✓ Centralized management with localized operations</li>
                <li>✓ Better resource allocation and staff distribution</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageHealthCenterGuide;
