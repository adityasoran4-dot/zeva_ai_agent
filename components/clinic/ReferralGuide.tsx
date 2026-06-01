"use client";
import React, { useState } from 'react';
import { Users, UserPlus } from 'lucide-react';

const ReferralGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-500 rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Users className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Referral Management - Complete Guide</h1>
              <p className="text-purple-100 text-sm">Comprehensive guide for managing patient referrals and referral partners</p>
            </div>
          </div>
          
          
        </div>

        {/* Quick Navigation Tabs */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Quick Navigation
          </h4>
          <div className="grid md:grid-cols-1 gap-3">
            {([] as {id: string; label: string; icon: any}[]).map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  activeSection === section.id
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <section.icon className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-900">{section.label}</span>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-semibold mb-2">🎯 Key Points:</p>
            <ul className="list-disc list-inside ml-4 space-y-1 text-xs text-blue-700">
              <li><strong>Track Partners:</strong> Manage external doctors, consultants, and partners who refer patients</li>
              <li><strong>Commission System:</strong> Set and track referral percentages for each partner</li>
              <li><strong>Contact Management:</strong> Store all referrer contact details in one place</li>
            </ul>
          </div>
        </div>

        {/* Overview Section */}
        {activeSection === "overview" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 p-6 rounded-r-lg">
              <h4 className="font-bold text-lg text-purple-900 mb-4 flex items-center gap-2">
                {/* <span className="flex i What is a Referral?tems-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full text-sm font-bold">1</span> */}
             
              </h4>
              <div className="ml-10 space-y-4">
                

                {/* Image Section - Referral Management */}
                <div className="w-full bg-purple-50 rounded-xl border border-purple-200 p-6 mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Referral Management Interface
                  </h3>
                  <div className="bg-white rounded-lg border-2 border-purple-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                    <img 
                      src="/ref.png" 
                      alt="Referral Management" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement?.querySelector('.placeholder-referral')?.classList.remove('hidden');
                      }}
                    />
                    <div className="placeholder-referral hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-violet-50 text-gray-500">
                      <Users className="w-16 h-16 mb-4 text-purple-300" />
                      <p className="text-lg font-medium">Referral Management</p>
                      <p className="text-sm mt-2">Screenshot will appear here</p>
                    </div>
                  </div>
                </div>
                
              
                <div className="bg-white rounded-lg border border-purple-200 p-4">
                  <h5 className="font-semibold text-purple-900 mb-3">👥 Who Can You Refer?</h5>
                  <p className="text-sm text-purple-700 leading-relaxed mb-3">
                    You can add various types of referral partners to your system:
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-purple-50 rounded-lg p-3 border-l-4 border-purple-500">
                      <p className="font-semibold text-purple-900 mb-2">Medical Professionals:</p>
                      <ul className="list-disc list-inside ml-5 space-y-1 text-xs text-purple-700">
                        <li><strong>External Doctors:</strong> Specialists from other clinics</li>
                        <li><strong>General Practitioners:</strong> Family doctors referring cases</li>
                        <li><strong>Dentists:</strong> Dental professionals for oral health cases</li>
                        <li><strong>Surgeons:</strong> Surgical specialists needing support</li>
                        <li><strong>Physiotherapists:</strong> Rehabilitation specialists</li>
                      </ul>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-3 border-l-4 border-purple-500">
                      <p className="font-semibold text-purple-900 mb-2">Organizations:</p>
                      <ul className="list-disc list-inside ml-5 space-y-1 text-xs text-purple-700">
                        <li><strong>Hospitals:</strong> Larger healthcare facilities</li>
                        <li><strong>Insurance Companies:</strong> Health insurance providers</li>
                        <li><strong>Corporate Offices:</strong> Companies sending employees</li>
                        <li><strong>Consulting Firms:</strong> Healthcare consultants</li>
                        <li><strong>NGOs:</strong> Non-profit health organizations</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-purple-200 p-4">
                  <h5 className="font-semibold text-purple-900 mb-3">📋 What You Can Do:</h5>
                  <ul className="list-disc list-inside space-y-2 text-sm text-purple-700">
                    <li><strong>Add Referral Partners:</strong> Register new doctors, hospitals, or organizations</li>
                    <li><strong>Set Commission Rates:</strong> Define percentage (0-100%) for each referrer</li>
                    <li><strong>Edit Information:</strong> Update contact details or percentages anytime</li>
                    <li><strong>Delete Referrals:</strong> Remove inactive or incorrect entries</li>
                    <li><strong>Track Activities:</strong> Monitor which referrers send most patients</li>
                    <li><strong>Manage Contacts:</strong> Keep all referrer information organized</li>
                    <li><strong>Expense Tracking:</strong> Option to add expenses related to referrals</li>
                  </ul>
                </div>

              

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h5 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                    💼 Common Use Cases:
                  </h5>
                  <ul className="list-disc list-inside space-y-2 text-sm text-purple-700">
                    <li><strong>New Partnership:</strong> Add external doctor who will refer patients regularly</li>
                    <li><strong>Corporate Tie-up:</strong> Create referral for company sending employees for treatment</li>
                    <li><strong>Insurance Partner:</strong> Track referrals from insurance companies</li>
                    <li><strong>Consultant Network:</strong> Manage multiple consultants referring cases</li>
                    <li><strong>Rate Adjustment:</strong> Increase/decrease commission based on performance</li>
                    <li><strong>Contact Update:</strong> Change phone/email when referrer relocates</li>
                    <li><strong>Cleanup:</strong> Remove inactive referrers from system</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralGuide;
