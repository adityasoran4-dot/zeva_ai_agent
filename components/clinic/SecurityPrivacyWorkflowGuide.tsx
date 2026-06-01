"use client";
import React from "react";
import { Shield, CheckCircle, Mail, Smartphone, Users, Lock } from "lucide-react";

const SecurityPrivacyWorkflowGuide = () => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Security & Privacy</h1>
            <p className="text-gray-600 mt-1">Configure authentication settings and manage staff access permissions</p>
          </div>
        </div>
      </div>

      {/* Image Section */}
      <div className="w-full bg-blue-50 rounded-xl border border-blue-200 p-6 mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Authentication Settings Interface
        </h3>
        <div className="bg-white rounded-lg border-2 border-blue-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
          <img 
            src="/auth.png" 
            alt="Authentication Settings Screen" 
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement?.querySelector('.placeholder-auth')?.classList.remove('hidden');
            }}
          />
          <div className="placeholder-auth hidden text-center p-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-gray-600 font-medium">Image not found: /authentication.png</p>
            <p className="text-gray-400 text-sm mt-2">Please ensure authentication.png is in the public folder.</p>
          </div>
        </div>
      </div>

      {/* Detailed Explanation Section */}
      <div className="space-y-8">
        
        {/* 1. OTP Delivery Channels */}
        <div className="bg-white rounded-xl p-6 border-l-4 border-green-500 shadow-sm">
          <h4 className="font-bold text-green-800 mb-4 flex items-center gap-2 text-lg">
            <Lock className="w-5 h-5" />
            1. OTP Delivery Channels Configuration
          </h4>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Configure where One-Time Passwords (OTPs) will be delivered for secure authentication across your clinic system.
          </p>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold text-xl">•</span>
              <div>
                <strong>WhatsApp Number Setup:</strong> Enter a valid WhatsApp number (10-digit format with country code, e.g., +91XXXXXXXXXX) to receive OTP codes via WhatsApp messages for quick and convenient verification.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold text-xl">•</span>
              <div>
                <strong>Email Address Configuration:</strong> Provide an official email address (e.g., clinic@example.com) to receive OTP codes via email as a backup or alternative delivery channel.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold text-xl">•</span>
              <div>
                <strong>Real-time Validation:</strong> The system validates phone numbers and email addresses instantly, showing format hints and error messages to ensure correct input before saving.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Dual Channel Security:</strong> Both WhatsApp and Email channels can be configured simultaneously, providing redundancy and ensuring OTP delivery even if one channel is unavailable.
              </div>
            </li>
          </ul>
        </div>

        {/* 2. Staff OTP Permissions */}
        <div className="bg-white rounded-xl p-6 border-l-4 border-purple-500 shadow-sm">
          <h4 className="font-bold text-purple-800 mb-4 flex items-center gap-2 text-lg">
            <Users className="w-5 h-5" />
            2. Staff OTP Permissions Management
          </h4>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Enable or disable OTP authentication requirements for individual staff members based on their roles and security needs.
          </p>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-purple-600 font-bold text-xl">•</span>
              <div>
                <strong>Agent OTP Control:</strong> Toggle OTP requirements for agents who handle patient inquiries, lead management, and appointment scheduling to balance security with operational efficiency.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-600 font-bold text-xl">•</span>
              <div>
                <strong>Doctor Staff OTP Control:</strong> Manage OTP settings for medical staff members who need secure access to patient records, treatment plans, and clinical data.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-600 font-bold text-xl">•</span>
              <div>
                <strong>Individual Toggle Switches:</strong> Each staff member has a dedicated toggle switch to enable or disable OTP authentication independently, allowing granular control over security levels.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-600 font-bold text-xl">•</span>
              <div>
                <strong>Real-time Status Indicators:</strong> Visual indicators show whether OTP is enabled (green checkmark) or disabled (gray icon) for each staff member at a glance.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Role-Based Filtering:</strong> Filter staff by role (All, Agents, Doctor Staff) and search by name or email to quickly locate and update specific team members' OTP settings.
              </div>
            </li>
          </ul>
        </div>

        {/* 3. Statistics Dashboard */}
        <div className="bg-white rounded-xl p-6 border-l-4 border-blue-500 shadow-sm">
          <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2 text-lg">
            <CheckCircle className="w-5 h-5" />
            3. Authentication Statistics Overview
          </h4>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Monitor authentication status across your entire staff with real-time statistics and visual progress indicators.
          </p>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl">•</span>
              <div>
                <strong>Total Staff Count:</strong> View the total number of staff members registered in your clinic system across all roles and departments.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl">•</span>
              <div>
                <strong>OTP Enabled Percentage:</strong> Track how many staff members have OTP authentication enabled, displayed as both a count and percentage with a visual progress bar.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl">•</span>
              <div>
                <strong>Agents vs Doctor Staff Breakdown:</strong> See separate counts for agents and doctor staff to understand the distribution of OTP-enabled users across different roles.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Live Updates:</strong> Statistics update automatically when you enable or disable OTP for any staff member, providing immediate feedback on security coverage.
              </div>
            </li>
          </ul>
        </div>

        {/* 4. Search and Filter Capabilities */}
        <div className="bg-white rounded-xl p-6 border-l-4 border-orange-500 shadow-sm">
          <h4 className="font-bold text-orange-800 mb-4 flex items-center gap-2 text-lg">
            <Mail className="w-5 h-5" />
            4. Advanced Search and Filtering
          </h4>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Quickly locate specific staff members and filter by role to efficiently manage OTP permissions across large teams.
          </p>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-orange-600 font-bold text-xl">•</span>
              <div>
                <strong>Name and Email Search:</strong> Type partial names or email addresses to instantly filter the staff list and find specific team members without scrolling through long lists.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-orange-600 font-bold text-xl">•</span>
              <div>
                <strong>Role-Based Filters:</strong> Select from dropdown options (All Roles, Agents, Doctor Staff) to view only staff members of a specific category for targeted permission updates.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-orange-600 font-bold text-xl">•</span>
              <div>
                <strong>Combined Filtering:</strong> Use both search and role filters together to narrow down results precisely, such as finding all agents with "John" in their name.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Result Counter:</strong> Display shows "Showing X of Y staff members" to indicate filtered results versus total count, helping you track filtering effectiveness.
              </div>
            </li>
          </ul>
        </div>

        {/* 5. Save and Validation Features */}
        <div className="bg-white rounded-xl p-6 border-l-4 border-red-500 shadow-sm">
          <h4 className="font-bold text-red-800 mb-4 flex items-center gap-2 text-lg">
            <Smartphone className="w-5 h-5" />
            5. Data Validation and Save Operations
          </h4>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Ensure data integrity with comprehensive validation and instant save functionality for all authentication settings.
          </p>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold text-xl">•</span>
              <div>
                <strong>Phone Number Validation:</strong> System validates WhatsApp numbers to ensure proper format (10 digits with optional country code), preventing invalid entries that could block OTP delivery.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold text-xl">•</span>
              <div>
                <strong>Email Format Validation:</strong> Real-time email validation checks for proper syntax (user@domain.com format) to ensure OTP emails reach the correct inbox.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold text-xl">•</span>
              <div>
                <strong>Instant Feedback:</strong> Error messages appear immediately below input fields when validation fails, guiding users to correct mistakes before attempting to save.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold text-xl">•</span>
              <div>
                <strong>Auto-Normalization:</strong> Phone numbers are automatically normalized to standard format (+91XXXXXXXXXX) during save, ensuring consistency across the system.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>One-Click Save:</strong> Click the "Save Changes" button to persist all modifications including OTP delivery channels and staff permission toggles in a single operation with visual confirmation.
              </div>
            </li>
          </ul>
        </div>

        {/* 6. User Experience Enhancements */}
        <div className="bg-white rounded-xl p-6 border-l-4 border-cyan-500 shadow-sm">
          <h4 className="font-bold text-cyan-800 mb-4 flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5" />
            6. Enhanced User Experience Features
          </h4>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Modern UI design with intuitive interactions and helpful visual cues to simplify authentication management.
          </p>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-cyan-600 font-bold text-xl">•</span>
              <div>
                <strong>Format Hint Tooltips:</strong> When focusing on the WhatsApp number field, a helpful tooltip appears showing the expected format (+91 XXXXXXXXXX) to guide proper input.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-600 font-bold text-xl">•</span>
              <div>
                <strong>Current Value Display:</strong> After entering a valid phone number, the formatted version displays below the input field (e.g., "+91 98765 43210") for easy verification.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-600 font-bold text-xl">•</span>
              <div>
                <strong>Animated Success States:</strong> Save button transforms to show "Changes Saved!" with a checkmark icon for 3 seconds after successful save, providing clear confirmation.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-600 font-bold text-xl">•</span>
              <div>
                <strong>Loading Indicators:</strong> During save operations, the button shows a spinning loader with "Saving Changes..." text to prevent duplicate submissions and indicate processing.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-cyan-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Responsive Design:</strong> Fully responsive layout adapts to mobile, tablet, and desktop screens with optimized table views and touch-friendly toggle switches for all device types.
              </div>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default SecurityPrivacyWorkflowGuide;
