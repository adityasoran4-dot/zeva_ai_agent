"use client";
import React from 'react';
import { Globe, Smartphone, MessageSquare, Mail } from 'lucide-react';

const ProvidersGuide: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Communication Providers - Setup & Management</h1>
            <p className="text-gray-600 mt-1">Configure and manage WhatsApp, SMS, and Email communication channels for your clinic</p>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-600" />
            What are Communication Providers?
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            Communication Providers are the secure, encrypted channels that connect your clinic to patients 
            through various messaging platforms. These providers enable you to send appointment reminders, 
            billing notifications, marketing messages, and engage in two-way conversations via WhatsApp Business, 
            SMS gateways, and Email services. Each provider is configured with API credentials and manages 
            message delivery, tracking, and compliance with platform regulations.
          </p>

          {/* Image Placeholder */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Providers Dashboard Overview
            </h3>
            <div className="bg-white rounded-lg border-2 border-blue-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '400px', maxHeight: '600px' }}>
              <img 
                src="/provider.png" 
                alt="Providers Dashboard" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-providers')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-providers hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-500">
                <Globe className="w-16 h-16 mb-4 text-blue-300" />
                <p className="text-lg font-medium">Providers Dashboard</p>
                <p className="text-sm mt-2">Screenshot will appear here</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Key Features:</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li><strong>Multi-Channel Support:</strong> WhatsApp Business API, SMS Gateway, Email Services (Gmail, Outlook)</li>
              <li><strong>Status Tracking:</strong> Monitor provider approval status (Approved, Pending, Rejected, In-Progress)</li>
              <li><strong>Inbox Automation:</strong> Auto-route incoming messages to unified inbox</li>
              <li><strong>Encrypted Credentials:</strong> AES-256 encryption for all API keys and secrets</li>
              <li><strong>Real-Time Sync:</strong> Track last synchronization time for each provider</li>
              <li><strong>Grid/Table Views:</strong> Switch between visual cards or detailed table layout</li>
              <li><strong>Advanced Filtering:</strong> Filter by status, type, search by name or phone</li>
              <li><strong>Pagination:</strong> Navigate through large provider libraries (9 per page)</li>
              <li><strong>Edit & Delete:</strong> Manage existing provider configurations</li>
              <li><strong>Statistics Dashboard:</strong> Overview of total, active, pending, and approved providers</li>
            </ul>
          </div>
        </div>
      </div>

      {/* What You Can See Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            What You Can See in the Providers Section
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Statistics Cards */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-3">📊 Statistics Dashboard (Top Section)</h4>
              <ul className="space-y-2 text-sm text-purple-800">
                <li><strong>Total Providers Card:</strong> Total number of configured providers (blue icon)</li>
                <li><strong>Active Providers:</strong> Currently active and working providers (green card with Zap icon)</li>
                <li><strong>Pending Approval:</strong> Providers awaiting platform approval (yellow card with Clock icon)</li>
                <li><strong>WhatsApp Count:</strong> Number of WhatsApp providers (emerald card)</li>
                <li><strong>SMS Count:</strong> Number of SMS gateway providers (blue card)</li>
                <li><strong>Email Count:</strong> Number of email service providers (purple card)</li>
              </ul>
            </div>

            {/* Search & Filter Controls */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="font-semibold text-indigo-900 mb-3">🔍 Search & Filter Controls</h4>
              <ul className="space-y-2 text-sm text-indigo-800">
                <li><strong>Status Tabs:</strong> All, Approved, Pending, In-Progress, Rejected</li>
                <li><strong>View Toggle:</strong> Switch between Grid view (cards) and Table view (list)</li>
                <li><strong>Search Bar:</strong> Search providers by name, label, phone, or email</li>
                <li><strong>Type Filter:</strong> Dropdown to filter by WhatsApp, SMS, or Email</li>
                <li><strong>Refresh Button:</strong> Manually reload provider data from server</li>
                <li><strong>Add Provider Button:</strong> Opens modal to configure new provider</li>
              </ul>
            </div>

            {/* Provider Cards (Grid View) */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-3">🎴 Provider Cards (Grid View)</h4>
              <ul className="space-y-2 text-sm text-green-800">
                <li><strong>Provider Icon:</strong> Visual indicator (Smartphone for WhatsApp, MessageSquare for SMS, Mail for Email)</li>
                <li><strong>Provider Label:</strong> Display name for easy identification</li>
                <li><strong>Provider Name:</strong> Technical identifier in code format</li>
                <li><strong>Country Code:</strong> Country flag/code for international providers</li>
                <li><strong>Status Badge:</strong> Color-coded status (Green=Approved, Yellow=Pending, Red=Rejected)</li>
                <li><strong>Contact Info:</strong> Phone number and/or email address</li>
                <li><strong>Last Synced:</strong> Time since last successful synchronization</li>
                <li><strong>Type Badges:</strong> Shows provider type(s) with icons</li>
                <li><strong>Auto-Inbox Badge:</strong> Blue badge if inbox automation is enabled</li>
                <li><strong>Action Buttons:</strong> Edit (for WhatsApp), Delete buttons in footer</li>
              </ul>
            </div>

            {/* Table View */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-3">📋 Table View Layout</h4>
              <ul className="space-y-2 text-sm text-orange-800">
                <li><strong>Provider Column:</strong> Icon + Label + Name + Auto-Inbox indicator</li>
                <li><strong>Type Column:</strong> Type badges + Email provider subtype (Gmail/Outlook)</li>
                <li><strong>Status Column:</strong> Status badge with icon</li>
                <li><strong>Contact Column:</strong> Phone (primary) + Email (secondary)</li>
                <li><strong>Last Synced Column:</strong> Date + Update timestamp</li>
                <li><strong>Actions Column:</strong> View, Edit, Delete buttons</li>
                <li><strong>Hover Effects:</strong> Row highlighting on hover</li>
              </ul>
            </div>
          </div>

          {/* Provider Types Details */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h4 className="font-semibold text-emerald-900 mb-3">🔌 Available Provider Types</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                <p className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  WhatsApp Business
                </p>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• Green smartphone icon</li>
                  <li>• Requires Meta Business verification</li>
                  <li>• Template approval needed</li>
                  <li>• 24-hour messaging window</li>
                  <li>• End-to-end encrypted</li>
                  <li>• Rich media support</li>
                  <li>• Inbox automation available</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                <p className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  SMS Gateway
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Blue message icon</li>
                  <li>• Real-time delivery</li>
                  <li>• Number type (Toll-free/Long-code)</li>
                  <li>• No template approval</li>
                  <li>• 160 character limit per segment</li>
                  <li>• Universal compatibility</li>
                  <li>• Instant delivery reports</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
                <p className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Service
                </p>
                <ul className="text-xs text-purple-700 space-y-1">
                  <li>• Purple mail icon</li>
                  <li>• Gmail or Outlook integration</li>
                  <li>• HTML formatting support</li>
                  <li>• High deliverability rates</li>
                  <li>• Attachment capabilities</li>
                  <li>• No time restrictions</li>
                  <li>• Transactional & marketing emails</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-3">🎯 Status Indicators</h4>
            <div className="grid md:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg p-3 border-l-4 border-green-500">
                <p className="font-semibold text-green-900 mb-1 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Approved
                </p>
                <p className="text-xs text-green-700">Ready to use, fully operational</p>
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-yellow-500">
                <p className="font-semibold text-yellow-900 mb-1 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Pending
                </p>
                <p className="text-xs text-yellow-700">Awaiting platform approval</p>
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-blue-500">
                <p className="font-semibold text-blue-900 mb-1 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  In-Progress
                </p>
                <p className="text-xs text-blue-700">Setup in progress, not yet ready</p>
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-red-500">
                <p className="font-semibold text-red-900 mb-1 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Rejected
                </p>
                <p className="text-xs text-red-700">Failed verification, needs correction</p>
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
            How to Configure & Manage Providers
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            Setting up communication providers is essential for enabling patient outreach. Follow these steps 
            to add, configure, and manage your clinic's communication channels effectively.
          </p>

          <div className="bg-teal-50 border border-teal-200 rounded-lg p-5">
            <h4 className="font-semibold text-teal-900 mb-3">Step-by-Step Configuration Guide:</h4>
            <ol className="space-y-4 text-sm text-teal-800">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <strong>Navigate to Providers:</strong> Go to Marketing → Providers from the sidebar menu. The dashboard loads showing statistics cards at the top and your configured providers below.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <strong>Review Statistics:</strong> Check the stats cards to see your current setup - total providers, active count, pending approvals, and breakdown by type (WhatsApp, SMS, Email).
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <div>
                  <strong>Click "Add Provider":</strong> Click the black "Add Provider" button in the top-right corner. This opens a modal with three provider type options.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <div>
                  <strong>Select Provider Type:</strong> Choose from three options:
                  <ul className="list-disc list-inside ml-5 mt-2 space-y-1 text-xs">
                    <li><strong>WhatsApp Business:</strong> For WhatsApp messaging (requires Meta verification)</li>
                    <li><strong>SMS Gateway:</strong> For SMS notifications (coming soon)</li>
                    <li><strong>Email Service:</strong> For email communications (coming soon)</li>
                  </ul>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                <div>
                  <strong>Configure WhatsApp Provider:</strong> If you selected WhatsApp, fill in the configuration form:
                  <ul className="list-disc list-inside ml-5 mt-2 space-y-1 text-xs">
                    <li><strong>Label:</strong> Descriptive name (e.g., "Main Clinic WhatsApp")</li>
                    <li><strong>Phone Number:</strong> Your WhatsApp Business phone with country code</li>
                    <li><strong>API Key:</strong> Meta Business API key</li>
                    <li><strong>API Secret:</strong> Encrypted secret key</li>
                    <li><strong>Business Account ID:</strong> Your Meta Business Manager ID</li>
                    <li><strong>Enable Inbox Automation:</strong> Toggle to auto-route messages to inbox</li>
                  </ul>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">6</span>
                <div>
                  <strong>Submit for Verification:</strong> Click "Save" or "Submit". The provider status changes to "Pending" while Meta reviews your application (typically 24-72 hours).
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">7</span>
                <div>
                  <strong>Monitor Status:</strong> Return to the Providers page to check approval status. Refresh the page or click the Refresh button to update statuses.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">8</span>
                <div>
                  <strong>Filter & Search:</strong> Use the tools to find specific providers:
                  <ul className="list-disc list-inside ml-5 mt-2 space-y-1 text-xs">
                    <li>Click status tabs (All, Approved, Pending, etc.)</li>
                    <li>Type in search bar to find by name/phone</li>
                    <li>Use type dropdown to filter by WhatsApp/SMS/Email</li>
                    <li>Toggle between Grid and Table views</li>
                  </ul>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">9</span>
                <div>
                  <strong>Edit WhatsApp Providers:</strong> Click the Edit (pencil) icon on any WhatsApp provider card to modify settings, update API credentials, or toggle inbox automation.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">10</span>
                <div>
                  <strong>Delete Providers:</strong> Click the Delete (trash) icon to remove a provider. A confirmation modal appears warning you this action cannot be undone. Deleted providers stop all message delivery immediately.
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Best Practices for Provider Management:</h4>
            <ul className="list-disc list-inside space-y-2 text-sm text-blue-800">
              <li>Use descriptive labels to easily identify providers (e.g., "Appointment Reminders", "Billing Notifications")</li>
              <li>Enable inbox automation for providers you want to monitor in real-time</li>
              <li>Keep API credentials secure and never share them outside the platform</li>
              <li>Regularly check "Last Synced" timestamps to ensure providers are functioning</li>
              <li>Maintain backup providers for critical communication channels</li>
              <li>Test new providers with sample messages before using in production</li>
              <li>Document provider purposes and configurations for team reference</li>
              <li>Remove unused or rejected providers to keep the dashboard clean</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
            <p className="text-sm text-yellow-800">
              <strong>Important Security Note:</strong> All provider credentials (API keys, secrets, tokens) are encrypted using AES-256 encryption before storage. Never share your API credentials via email or chat. If you suspect a credential has been compromised, delete the provider immediately and create a new one with fresh credentials.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">Troubleshooting Common Issues:</h4>
            <ul className="list-disc list-inside space-y-2 text-sm text-green-800">
              <li><strong>Provider stuck in "Pending":</strong> Contact Meta Business Support or check your business verification status</li>
              <li><strong>"Last Synced" shows "Never":</strong> Provider may have invalid credentials - edit and re-save</li>
              <li><strong>Messages not delivering:</strong> Verify provider status is "Approved" and check API quota limits</li>
              <li><strong>Inbox not receiving messages:</strong> Ensure "Inbox Automation" is enabled for the provider</li>
              <li><strong>Edit button disabled:</strong> Only WhatsApp providers can be edited currently; SMS/Email coming soon</li>
            </ul>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2">WhatsApp Provider Requirements:</h4>
            <ul className="list-disc list-inside space-y-2 text-sm text-purple-800">
              <li>Verified Meta Business Manager account</li>
              <li>WhatsApp Business API access (apply through Meta)</li>
              <li>Dedicated phone number not used on WhatsApp mobile app</li>
              <li>Business profile completion (name, category, description)</li>
              <li>Compliance with WhatsApp Business Policy</li>
              <li>Template message approval for outbound messaging after 24-hour window</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProvidersGuide;
