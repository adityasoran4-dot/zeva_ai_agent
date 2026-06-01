"use client";
import React from 'react';
import { UserPlus, Users } from 'lucide-react';

const CreateLeadGuide: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Lead - Lead Management System</h1>
            <p className="text-gray-600 mt-1">Capture and manage potential customers in your CRM system</p>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-purple-600" />
            What is Lead Creation?
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            The Create Lead module helps you capture and manage potential customers who have shown 
            interest in your clinic's services. This is the first step in your sales funnel where 
            prospects enter your CRM system. A lead is a person or organization that has expressed 
            interest but hasn't yet become a paying patient/customer.
          </p>

          {/* Image Placeholder */}
          <div className="bg-purple-50 rounded-xl border border-purple-200 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Create Lead Interface
            </h3>
            <div className="bg-white rounded-lg border-2 border-purple-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '600px', maxHeight: '700px' }}>
              <img 
                src="/lead.png" 
                alt="Create Lead Form" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-create-lead')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-create-lead hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 text-gray-500">
                <UserPlus className="w-16 h-16 mb-4 text-purple-300" />
                <p className="text-lg font-medium">Create Lead Form</p>
                <p className="text-sm mt-2">Screenshot will appear here</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-purple-900 mb-2">Key Features:</h4>
            <ul className="space-y-2 text-sm text-purple-800">
              <li><strong>Quick Entry Form:</strong> Fast lead creation with essential fields</li>
              <li><strong>Contact Capture:</strong> Store name, phone, email, location details</li>
              <li><strong>Source Tracking:</strong> Record how leads found your clinic (Website, Walk-in, Referral, Social Media)</li>
              <li><strong>Service Interest:</strong> Document which treatment they're interested in</li>
              <li><strong>Status Management:</strong> Track progression through sales funnel (New, Contacted, Qualified, Converted, Lost)</li>
              <li><strong>Follow-up Reminders:</strong> Schedule and never miss scheduled follow-ups</li>
              <li><strong>Communication History:</strong> Log all calls, emails, messages</li>
              <li><strong>Conversion Tracking:</strong> Monitor lead-to-patient conversion rates</li>
              <li><strong>Team Assignment:</strong> Assign leads to specific staff members</li>
              <li><strong>Notes & Requirements:</strong> Record detailed information about their needs</li>
            </ul>
          </div>
        </div>
      </div>

      {/* What You Can See Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            What You Can See in Create Lead
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Lead Information Fields */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-3">📝 Lead Information Fields</h4>
              <ul className="space-y-2 text-sm text-purple-800">
                <li><strong>First Name *:</strong> Required field for lead's first name</li>
                <li><strong>Last Name:</strong> Optional family name or surname</li>
                <li><strong>Email Address:</strong> Primary email for communication</li>
                <li><strong>Phone Number *:</strong> Required primary contact number</li>
                <li><strong>Location:</strong> City or area where lead resides</li>
                <li><strong>Preferred Contact Method:</strong> Phone, Email, or WhatsApp preference</li>
              </ul>
            </div>

            {/* Lead Details */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="font-semibold text-indigo-900 mb-3">🎯 Lead Details</h4>
              <ul className="space-y-2 text-sm text-indigo-800">
                <li><strong>Lead Source *:</strong> How they found your clinic (required)</li>
                <li><strong>Service Interest:</strong> Treatment/service they want</li>
                <li><strong>Initial Notes:</strong> Additional requirements or comments</li>
                <li><strong>Lead Status:</strong> Current stage in sales funnel</li>
                <li><strong>Assigned To:</strong> Staff member responsible for follow-up</li>
                <li><strong>Follow-up Date:</strong> Scheduled next contact date & time</li>
              </ul>
            </div>

            {/* Lead Sources */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-3">🏢 Common Lead Sources</h4>
              <ul className="space-y-2 text-sm text-green-800">
                <li><strong>Website:</strong> Contact form submissions</li>
                <li><strong>Walk-in:</strong> Direct clinic visits</li>
                <li><strong>Phone Call:</strong> Inbound inquiries</li>
                <li><strong>Facebook/Instagram:</strong> Social media responses</li>
                <li><strong>Google:</strong> Google My Business/Search ads</li>
                <li><strong>Referral:</strong> Existing patient recommendations</li>
                <li><strong>Events:</strong> Health camps, exhibitions</li>
                <li><strong>Marketing Campaigns:</strong> Paid advertising responses</li>
              </ul>
            </div>

            {/* Lead Status Options */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-3">📊 Lead Status Stages</h4>
              <ul className="space-y-2 text-sm text-orange-800">
                <li><strong>New:</strong> Just created, not yet contacted</li>
                <li><strong>Contacted:</strong> Initial communication made</li>
                <li><strong>Qualified:</strong> Meets criteria, interested in services</li>
                <li><strong>Appointment Scheduled:</strong> Consultation booked</li>
                <li><strong>Converted:</strong> Became a patient/customer</li>
                <li><strong>Lost:</strong> Not interested or chose competitor</li>
              </ul>
            </div>
          </div>

          {/* Service Interest Examples */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h4 className="font-semibold text-emerald-900 mb-3">🦷 Common Service Interests</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-3 border-l-4 border-teal-500">
                <p className="font-semibold text-teal-900 mb-2">General Dentistry</p>
                <ul className="text-xs text-teal-700 space-y-1">
                  <li>• Regular Check-ups</li>
                  <li>• Dental Cleaning</li>
                  <li>• Fillings</li>
                  <li>• Root Canal Treatment</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-blue-500">
                <p className="font-semibold text-blue-900 mb-2">Cosmetic Dentistry</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Teeth Whitening</li>
                  <li>• Veneers</li>
                  <li>• Smile Makeover</li>
                  <li>• Bonding</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-purple-500">
                <p className="font-semibold text-purple-900 mb-2">Specialized Treatments</p>
                <ul className="text-xs text-purple-700 space-y-1">
                  <li>• Dental Implants</li>
                  <li>• Orthodontics/Braces</li>
                  <li>• Invisalign</li>
                  <li>• Gum Treatment</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Image Section - Complete Interface */}
          <div className="bg-purple-50 rounded-xl border border-purple-200 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
            Create New Lead Interface
            </h3>
            <div className="bg-white rounded-lg border-2 border-purple-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '600px', maxHeight: '700px' }}>
              <img 
                src="/create-lead.png" 
                alt="Complete Create Lead Interface" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-complete-view')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-complete-view hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 text-gray-500">
                <UserPlus className="w-16 h-16 mb-4 text-purple-300" />
                <p className="text-lg font-medium">Complete Create Lead Interface</p>
                <p className="text-sm mt-2">Screenshot will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How to Use Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            How to Create a New Lead
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            Creating a new lead is a simple process. Follow these steps to capture prospect information 
            accurately and set up proper follow-up tracking for maximum conversion.
          </p>

          <div className="bg-teal-50 border border-teal-200 rounded-lg p-5">
            <h4 className="font-semibold text-teal-900 mb-3">Step-by-Step Guide:</h4>
            <ol className="space-y-4 text-sm text-teal-800">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <strong>Navigate to Create Lead:</strong> Go to Marketing → Create Lead from the sidebar menu. The lead creation form loads with all required fields.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <strong>Enter First Name *:</strong> Type the lead's first name in the required field. Example: "Ahmed", "Sarah", "Mohammed". This cannot be left empty.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <div>
                  <strong>Add Last Name:</strong> Optionally enter the last name or family name. Example: "Al Mansoori", "Johnson", "Khan". Helps with complete identification.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <div>
                  <strong>Enter Email Address:</strong> Input their primary email address if available. Format: "name@example.com". Useful for appointment confirmations and email campaigns.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                <div>
                  <strong>Enter Phone Number *:</strong> Provide the primary contact number (required). Format: "+971 50 123 4567" or local format. Should be an active WhatsApp number if possible for modern communication.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">6</span>
                <div>
                  <strong>Select Location:</strong> Choose the city or area where the lead resides. Examples: "Dubai", "Abu Dhabi", "Sharjah", "Jumeirah". Helps with demographic analysis and location-specific offers.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">7</span>
                <div>
                  <strong>Choose Lead Source *:</strong> Select how they found your clinic (required). Common options: Website, Walk-in, Phone Call, Facebook, Instagram, Google, Referral, Other. Important for marketing ROI tracking.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">8</span>
                <div>
                  <strong>Select Service Interest:</strong> Pick the service/treatment they're interested in. Examples: Dental Implants, Teeth Whitening, Orthodontics, General Dentistry, Cosmetic Dentistry. Helps route to appropriate department.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">9</span>
                <div>
                  <strong>Add Initial Notes:</strong> Write any additional requirements or comments discussed. Example: "Interested in Invisalign consultation, prefers morning appointments". Helps prepare for follow-up conversation.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">10</span>
                <div>
                  <strong>Save the Lead:</strong> Click the "Save" or "Create Lead" button to submit the form. A success message appears with the lead ID. Set follow-up date/time if needed immediately after creation.
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Best Practices for Lead Creation:</h4>
            <ul className="list-disc list-inside space-y-2 text-sm text-blue-800">
              <li><strong>Speed Matters:</strong> Create leads immediately while information is fresh in your mind</li>
              <li><strong>Complete Information:</strong> Capture as many details as possible for better follow-up effectiveness</li>
              <li><strong>Accurate Source:</strong> Always record the correct lead source for accurate marketing analysis</li>
              <li><strong>Clear Notes:</strong> Write detailed notes so anyone on the team can follow up effectively</li>
              <li><strong>Quick Follow-up:</strong> Contact new leads within 24 hours for best conversion rates</li>
              <li><strong>WhatsApp Enabled:</strong> Mark if the phone number has WhatsApp for modern communication preferences</li>
              <li><strong>Privacy Compliance:</strong> Ensure you have consent for communication (GDPR/local regulations)</li>
              <li><strong>Regular Review:</strong> Review and update lead status regularly to keep data current</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> Speed is critical in lead management. Studies show that contacting leads within 5 minutes increases conversion rates by 9x compared to waiting 30 minutes. Always prioritize quick response times for new leads to maximize your conversion potential.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">Example Lead Entry:</h4>
            <div className="bg-white rounded-lg p-3 border border-green-200 mt-2">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-green-100">
                    <td className="py-2 px-3 font-semibold text-green-900">First Name:</td>
                    <td className="py-2 px-3 text-green-800">Fatima</td>
                  </tr>
                  <tr className="border-b border-green-100">
                    <td className="py-2 px-3 font-semibold text-green-900">Last Name:</td>
                    <td className="py-2 px-3 text-green-800">Al Hashimi</td>
                  </tr>
                  <tr className="border-b border-green-100">
                    <td className="py-2 px-3 font-semibold text-green-900">Email:</td>
                    <td className="py-2 px-3 text-green-800">fatima@email.com</td>
                  </tr>
                  <tr className="border-b border-green-100">
                    <td className="py-2 px-3 font-semibold text-green-900">Phone:</td>
                    <td className="py-2 px-3 text-green-800">+971 50 123 4567</td>
                  </tr>
                  <tr className="border-b border-green-100">
                    <td className="py-2 px-3 font-semibold text-green-900">Location:</td>
                    <td className="py-2 px-3 text-green-800">Dubai Marina</td>
                  </tr>
                  <tr className="border-b border-green-100">
                    <td className="py-2 px-3 font-semibold text-green-900">Source:</td>
                    <td className="py-2 px-3 text-green-800">Instagram Ad</td>
                  </tr>
                  <tr className="border-b border-green-100">
                    <td className="py-2 px-3 font-semibold text-green-900">Service Interest:</td>
                    <td className="py-2 px-3 text-green-800">Teeth Whitening</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-green-900">Notes:</td>
                    <td className="py-2 px-3 text-green-800">Interested in premium whitening, wants appointment next week</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-green-600 mt-2 italic">This lead should be contacted within 24 hours for best conversion rate</p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2">Who Uses This System:</h4>
            <div className="space-y-3 mt-3">
              <div className="bg-white rounded-lg p-3 border-l-4 border-purple-500">
                <p className="font-semibold text-purple-900 mb-1">Front Desk/Reception:</p>
                <ul className="list-disc list-inside ml-5 space-y-1 text-xs text-purple-700">
                  <li>Create leads from walk-in inquiries</li>
                  <li>Enter phone call details during conversations</li>
                  <li>Schedule initial consultations</li>
                  <li>Follow up with no-shows</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg p-3 border-l-4 border-purple-500">
                <p className="font-semibold text-purple-900 mb-1">Sales/Marketing Team:</p>
                <ul className="list-disc list-inside ml-5 space-y-1 text-xs text-purple-700">
                  <li>Process website and social media leads</li>
                  <li>Handle corporate inquiries</li>
                  <li>Manage event-generated leads</li>
                  <li>Track campaign effectiveness</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg p-3 border-l-4 border-purple-500">
                <p className="font-semibold text-purple-900 mb-1">Clinic Admin:</p>
                <ul className="list-disc list-inside ml-5 space-y-1 text-xs text-purple-700">
                  <li>Monitor lead conversion rates</li>
                  <li>Assign leads to team members</li>
                  <li>Analyze lead sources and performance</li>
                  <li>Generate reports and insights</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateLeadGuide;
