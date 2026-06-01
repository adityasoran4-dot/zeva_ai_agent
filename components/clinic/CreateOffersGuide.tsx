"use client";
import React from "react";
import { Gift } from "lucide-react";

const CreateOffersGuide: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex items-center gap-3 mb-8">
        <Gift className="w-10 h-10 text-teal-600" />
        <h2 className="text-3xl font-bold text-gray-900">Create Offers</h2>
      </div>

      <div className="prose max-w-none">
        {/* Offers Overview Section */}
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-l-4 border-teal-500 p-8 mb-10 rounded-r-lg">
          <h4 className="font-bold text-lg text-teal-900 mb-5 flex items-center gap-2">
            <span className="flex items-center justify-center w-10 h-10 bg-teal-600 text-white rounded-full text-base font-bold">1</span>
            Offers Dashboard Overview
          </h4>
          <div className="ml-12 space-y-4">
            <p className="text-base text-teal-800 leading-relaxed">
              The Create Offers module enables you to design, configure, and manage promotional offers 
              to attract new patients and retain existing ones. The dashboard provides a complete overview 
              of all your clinic's promotional campaigns.
            </p>
            <ul className="list-disc list-inside space-y-3 text-base text-teal-700">
              <li><strong>Offers List:</strong> View all active, draft, and expired offers in one place</li>
              <li><strong>Status Indicators:</strong> Visual badges showing Active, Draft, Expired, or Expiring Soon status</li>
              <li><strong>Statistics Cards:</strong> Quick stats showing Total Offers, Active Offers, Total Value, and Expiring Soon count</li>
              <li><strong>Search & Filter:</strong> Find specific offers by name, code, or status</li>
              <li><strong>Quick Actions:</strong> Edit, delete, or duplicate offers directly from the list</li>
              <li><strong>Performance Metrics:</strong> Track uses count, conversion rates, and revenue impact</li>
            </ul>
            
            {/* Image Section - Overall Offers Page */}
            <div className="w-full bg-teal-50 rounded-xl border border-teal-200 p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Offers Dashboard - Complete Overview
              </h3>
              <div className="bg-white rounded-lg border-2 border-teal-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                <img 
                  src="/offer.png" 
                  alt="Offers Dashboard Overview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.querySelector('.placeholder-dashboard')?.classList.remove('hidden');
                  }}
                />
                <div className="placeholder-dashboard hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50 text-gray-500">
                  <Gift className="w-16 h-16 mb-4 text-teal-300" />
                  <p className="text-lg font-medium">Offers Dashboard Overview</p>
                  <p className="text-sm mt-2">Screenshot will appear here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Create New Offer Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-8 mb-10 rounded-r-lg">
          <h4 className="font-bold text-lg text-blue-900 mb-5 flex items-center gap-2">
            <span className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full text-base font-bold">2</span>
            Create New Offer - Step by Step
          </h4>
          <div className="ml-12 space-y-4">
            <p className="text-base text-blue-800 leading-relaxed">
              Click the "Create New Offer" button to open the offer creation form. Fill in all required 
              details to set up your promotional campaign:
            </p>
            <ul className="list-disc list-inside space-y-3 text-base text-blue-700">
              <li><strong>Offer Title:</strong> Catchy, descriptive name (e.g., "Summer Dental Checkup Special")</li>
              <li><strong>Description:</strong> Detailed explanation of benefits, terms, and what patients receive</li>
              <li><strong>Offer Type:</strong> Choose between Percentage discount, Fixed amount off, or Free Consultation</li>
              <li><strong>Discount Value:</strong> Specify discount amount (percentage 1-100% or fixed currency amount)</li>
              <li><strong>Currency:</strong> Select currency for fixed discounts (INR, USD, AED, etc.)</li>
              <li><strong>Offer Code:</strong> Unique coupon code for claiming (e.g., SUMMER2024)</li>
              <li><strong>Slug/URL:</strong> SEO-friendly identifier for online sharing</li>
              <li><strong>Start & End Date:</strong> Define when offer becomes active and expires</li>
              <li><strong>Timezone:</strong> Ensure correct timing (default: Asia/Kolkata)</li>
              <li><strong>Status:</strong> Set as Draft (hidden), Active (live), or Inactive (paused)</li>
              <li><strong>Maximum Uses:</strong> Total number of times offer can be claimed across all patients</li>
              <li><strong>Per User Limit:</strong> How many times a single patient can claim (default: 1)</li>
              <li><strong>Marketing Channels:</strong> Select platforms (Email, SMS, WhatsApp, Social Media, Website)</li>
              <li><strong>UTM Parameters:</strong> Track marketing effectiveness (Source, Medium, Campaign)</li>
              <li><strong>Treatment Selection:</strong> Link offer to specific treatments or services</li>
              <li><strong>Conditions:</strong> Add restrictions like minimum booking value, specific treatments, new patients only</li>
            </ul>
            
            {/* Image Section - Create New Offer Form */}
            <div className="w-full bg-blue-50 rounded-xl border border-blue-200 p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Create New Offer Form Interface
              </h3>
              <div className="bg-white rounded-lg border-2 border-blue-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                <img 
                  src="/create.png" 
                  alt="Create New Offer Form" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.querySelector('.placeholder-create')?.classList.remove('hidden');
                  }}
                />
                <div className="placeholder-create hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-500">
                  <Gift className="w-16 h-16 mb-4 text-blue-300" />
                  <p className="text-lg font-medium">Create New Offer Form</p>
                  <p className="text-sm mt-2">Screenshot will appear here</p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700"><strong>💡 Pro Tips:</strong></p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>✓ Use compelling titles and clear descriptions to attract patients</li>
                <li>✓ Make offer codes memorable and easy to type</li>
                <li>✓ Plan offers around holidays, seasons, or special events for maximum impact</li>
                <li>✓ Set realistic usage limits to control costs</li>
                <li>✓ Use UTM parameters to track which channels drive conversions</li>
                <li>✓ Promote underutilized services with targeted treatment offers</li>
              </ul>
            </div>
          </div>
        </div>

       
      </div>
    </div>
  );
};

export default CreateOffersGuide;
