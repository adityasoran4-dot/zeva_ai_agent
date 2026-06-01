"use client";
import React from 'react';
import { FileText, Mail, MessageSquare } from 'lucide-react';

const TemplatesGuide: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header Section */}
      <div className="flex items-center gap-3 mb-8">
        <FileText className="w-10 h-10 text-indigo-600" />
        <h2 className="text-3xl font-bold text-gray-900">Templates Management - Workflow Guide</h2>
      </div>
      
      <div className="prose max-w-none space-y-8">
        {/* Overview Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              Overview - Email & SMS Templates
            </h3>
          </div>
          
          <div className="p-6">
            {/* Image Placeholder */}
            <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Templates Management Dashboard
              </h3>
              <div className="bg-white rounded-lg border-2 border-indigo-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                <img 
                  src="/template.png" 
                  alt="Templates Management Dashboard" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.querySelector('.placeholder-templates')?.classList.remove('hidden');
                  }}
                />
                <div className="placeholder-templates hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 text-gray-500">
                  <FileText className="w-16 h-16 mb-4 text-indigo-300" />
                  <p className="text-lg font-medium">Templates Management Dashboard</p>
                  <p className="text-sm mt-2">Screenshot will appear here</p>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-4">
              <p className="text-base text-gray-700 leading-relaxed">
                The All Templates section is your centralized hub for managing communication templates 
                across multiple channels. This module displays all available WhatsApp, Email, and SMS 
                templates that can be used for patient communication, appointment reminders, billing 
                notifications, and marketing campaigns. You can view template details, check approval 
                status, preview content, and manage your entire template library from this single interface.
              </p>
              
              <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
                <h4 className="font-semibold text-indigo-900 mb-2">What's Available in This Section:</h4>
                <ul className="space-y-2 text-sm text-indigo-800">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-0.5">•</span>
                    <span><strong>Template Dashboard:</strong> Complete overview showing total templates, approved count, pending approvals, and breakdown by type (WhatsApp, Email, SMS)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-0.5">•</span>
                    <span><strong>Search & Filter:</strong> Search templates by name, category, or content. Filter by template type (WhatsApp/Email/SMS) and status (Approved/Pending/Rejected)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-0.5">•</span>
                    <span><strong>Grid/List View Toggle:</strong> Switch between visual grid cards or detailed list view based on your preference</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-0.5">•</span>
                    <span><strong>Template Cards:</strong> Each template shows name, type icon, category badge, status indicator, creation date, and action buttons</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-0.5">•</span>
                    <span><strong>Preview Functionality:</strong> Click "Preview" to see complete template content with variables before using it</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-0.5">•</span>
                    <span><strong>Edit & Delete:</strong> Modify existing templates or remove unused ones with confirmation dialogs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-0.5">•</span>
                    <span><strong>Sync Templates:</strong> Sync with external platforms (WhatsApp Business API) to fetch latest template updates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-0.5">•</span>
                    <span><strong>Pagination:</strong> Navigate through large template libraries with page controls (10 templates per page)</span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Dashboard Statistics Cards:</h4>
                <p className="text-sm text-blue-800 mb-3">At the top of the page, you'll see four stat cards showing:</p>
                <ul className="list-disc list-inside space-y-2 text-sm text-blue-800">
                  <li><strong>Total Templates:</strong> Total number of templates in your library (blue card)</li>
                  <li><strong>Approved Templates:</strong> Templates approved and ready to use (green card)</li>
                  <li><strong>Pending Approval:</strong> Templates awaiting approval from platform providers (yellow card)</li>
                  <li><strong>WhatsApp Templates:</strong> Count of WhatsApp-specific templates (purple card)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* What You Can See Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Mail className="w-6 h-6 text-green-600" />
              What You Can See in Templates Section
            </h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <p className="text-base text-gray-700 leading-relaxed">
                The Templates section provides complete visibility into all your communication templates. 
                Here's everything you can access and manage:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Template Types Available
                  </h4>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span><strong>WhatsApp Templates:</strong> Pre-approved message templates for WhatsApp Business API with green icon</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span><strong>Email Templates:</strong> HTML email templates for patient communication with red mail icon</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span><strong>SMS Templates:</strong> Text message templates for quick notifications with blue message icon</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span><strong>Category Badges:</strong> Templates organized by categories like Authentication, Marketing, Utility, Appointment, etc.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <h4 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Status Indicators
                  </h4>
                  <ul className="space-y-2 text-sm text-emerald-800">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 mt-0.5">•</span>
                      <span><strong>Approved (Green):</strong> Template is approved and ready to use for sending messages</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 mt-0.5">•</span>
                      <span><strong>Pending (Yellow):</strong> Template is submitted and awaiting approval from platform provider</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 mt-0.5">•</span>
                      <span><strong>Rejected (Red):</strong> Template was rejected - needs modification and resubmission</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 mt-0.5">•</span>
                      <span><strong>Draft (Gray):</strong> Template is saved but not yet submitted for approval</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2">Template Information Displayed:</h4>
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                    <p className="font-semibold text-purple-900 text-sm mb-2">Basic Details:</p>
                    <ul className="space-y-1 text-xs text-purple-700">
                      <li>• Template name and description</li>
                      <li>• Type (Email/SMS)</li>
                      <li>• Category/Tag classification</li>
                      <li>• Creation date and last modified</li>
                      <li>• Created by (staff member)</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                    <p className="font-semibold text-purple-900 text-sm mb-2">Content Preview:</p>
                    <ul className="space-y-1 text-xs text-purple-700">
                      <li>• Subject line (for emails)</li>
                      <li>• Message body with formatting</li>
                      <li>• Dynamic variables highlighted</li>
                      <li>• Character count (for SMS)</li>
                      <li>• Language specification</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                <p className="text-sm text-orange-800">
                  <strong>Best Practice:</strong> Keep templates concise and clear. For SMS, stay under 160 characters to avoid splitting. For emails, use compelling subject lines and include clear call-to-action buttons. Always test templates with sample data before using them with real patients.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How to Use Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              How to Use Templates Management
            </h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Navigate to All Templates</p>
                    <p className="text-sm text-gray-700">Go to Marketing → Templates in the sidebar navigation to access the templates dashboard with all your communication templates.</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">View Dashboard Statistics</p>
                    <p className="text-sm text-gray-700">Check the four stat cards at the top showing Total Templates, Approved Templates, Pending Approval count, and WhatsApp Templates breakdown.</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Search & Filter Templates</p>
                    <p className="text-sm text-gray-700">Use the search bar to find templates by name, category, or content. Apply filters for template type (WhatsApp/Email/SMS) and status (Approved/Pending/Rejected). Toggle between Grid view (visual cards) and List view (detailed rows).</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Review Template Cards</p>
                    <p className="text-sm text-gray-700">Each template card displays: template name, type icon (WhatsApp/Email/SMS), category badge, status indicator (Approved/Pending/Rejected), creation date, and action buttons (Preview, Edit, Delete).</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Preview Template Content</p>
                    <p className="text-sm text-gray-700">Click the "Preview" (eye icon) button on any template to open a modal showing complete template content with variables highlighted. This lets you verify the message before using it.</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">6</span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Edit Existing Templates</p>
                    <p className="text-sm text-gray-700">Click the "Edit" (pencil icon) button to modify template content, category, or other details. This opens the template editor where you can make changes and resubmit for approval if needed.</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">7</span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Delete Unused Templates</p>
                    <p className="text-sm text-gray-700">Click the "Delete" (trash icon) button to remove templates. A confirmation modal appears asking you to confirm deletion. This action cannot be undone.</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">8</span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Sync Templates</p>
                    <p className="text-sm text-gray-700">Click the "Sync Templates" button to fetch latest template updates from external platforms like WhatsApp Business API. This ensures your local template library stays synchronized with platform providers.</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">9</span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Create New Template</p>
                    <p className="text-sm text-gray-700">Click the "Create Template" button in the top-right corner to add a new template. You'll be taken to the template creation page where you can define template type, content, variables, and submit for approval.</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">10</span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Navigate Pages</p>
                    <p className="text-sm text-gray-700">Use pagination controls at the bottom to navigate through templates (10 per page). Jump to specific pages or use Previous/Next buttons.</p>
                  </div>
                </li>
              </ol>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-green-900 mb-2">Tips for Effective Templates:</h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-green-800">
                  <li>Keep SMS templates under 160 characters to avoid extra charges</li>
                  <li>Use clear, professional language that reflects your clinic's brand voice</li>
                  <li>Include opt-out instructions in promotional messages (required by law)</li>
                  <li>Test all dynamic variables to ensure they populate correctly</li>
                  <li>Create multiple versions for A/B testing to optimize engagement</li>
                  <li>Update templates regularly based on patient feedback and response rates</li>
                  <li>Organize templates with descriptive names and categories for easy finding</li>
                  <li>Review and update templates quarterly to keep information current</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">Common Template Categories:</h4>
                <div className="grid md:grid-cols-3 gap-3 mt-3">
                  <div className="bg-white rounded-lg p-3 border border-yellow-200">
                    <p className="font-semibold text-yellow-900 text-sm mb-1">📅 Appointments</p>
                    <p className="text-xs text-yellow-700">Confirmations, reminders, cancellations, rescheduling</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-yellow-200">
                    <p className="font-semibold text-yellow-900 text-sm mb-1">💰 Billing</p>
                    <p className="text-xs text-yellow-700">Invoices, payment confirmations, overdue notices</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-yellow-200">
                    <p className="font-semibold text-yellow-900 text-sm mb-1">🏥 Treatment</p>
                    <p className="text-xs text-yellow-700">Pre-care instructions, post-care follow-ups, test results</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-yellow-200">
                    <p className="font-semibold text-yellow-900 text-sm mb-1">🎉 Promotions</p>
                    <p className="text-xs text-yellow-700">Special offers, seasonal campaigns, new services</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-yellow-200">
                    <p className="font-semibold text-yellow-900 text-sm mb-1">⭐ Feedback</p>
                    <p className="text-xs text-yellow-700">Review requests, satisfaction surveys, testimonials</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-yellow-200">
                    <p className="font-semibold text-yellow-900 text-sm mb-1">👋 Onboarding</p>
                    <p className="text-xs text-yellow-700">Welcome messages, first visit info, clinic introduction</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Create New Template Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Template - Step by Step Guide
            </h3>
          </div>
          
          <div className="p-6">
            {/* Image Placeholder */}
            <div className="bg-purple-50 rounded-xl border border-purple-200 p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Create New Template Form
              </h3>
              <div className="bg-white rounded-lg border-2 border-purple-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                <img 
                  src="/createtemp.png" 
                  alt="Create New Template Form" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.querySelector('.placeholder-create-template')?.classList.remove('hidden');
                  }}
                />
                <div className="placeholder-create-template hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 text-gray-500">
                  <svg className="w-16 h-16 mb-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <p className="text-lg font-medium">Create New Template Form</p>
                  <p className="text-sm mt-2">Screenshot will appear here</p>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-4">
              <p className="text-base text-gray-700 leading-relaxed">
                Creating a new template allows you to design custom messages for patient communication. 
                The template creation form provides all the tools you need to build professional, 
                compliant templates for WhatsApp, Email, or SMS channels. Follow these steps to create 
                and submit your first template.
              </p>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
                <h4 className="font-semibold text-purple-900 mb-3">Steps to Create a New Template:</h4>
                <ol className="space-y-3 text-sm text-purple-800">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <div>
                      <strong>Click "Create Template":</strong> Navigate to Marketing → Templates and click the "Create Template" button in the top-right corner. This opens the template creation page.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <div>
                      <strong>Select Template Type:</strong> Choose the communication channel - WhatsApp (for WhatsApp Business API), Email (for HTML emails), or SMS (for text messages). Each type has different formatting options and character limits.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <div>
                      <strong>Enter Template Name:</strong> Provide a descriptive name that helps you identify the template later. Use clear naming like "Appointment Reminder - 24h" or "Payment Confirmation Email".
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                    <div>
                      <strong>Choose Category:</strong> Select the template category based on its purpose:
                      <ul className="list-disc list-inside ml-5 mt-2 space-y-1 text-xs">
                        <li><strong>Authentication:</strong> OTP codes, verification messages</li>
                        <li><strong>Marketing:</strong> Promotions, special offers, campaigns</li>
                        <li><strong>Utility:</strong> Appointment reminders, billing, updates</li>
                        <li><strong>Appointment:</strong> Booking confirmations, rescheduling</li>
                      </ul>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                    <div>
                      <strong>Write Template Content:</strong> Compose your message in the content editor. For WhatsApp/SMS, keep it concise. For Email, you can use rich HTML formatting. Include personalization where needed.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">6</span>
                    <div>
                      <strong>Add Dynamic Variables:</strong> Insert placeholders for personalized data using double curly braces syntax:
                      <ul className="list-disc list-inside ml-5 mt-2 space-y-1 text-xs">
                        <li><code>{`{{patient_name}}`}</code> - Patient's full name</li>
                        <li><code>{`{{appointment_date}}`}</code> - Scheduled appointment date</li>
                        <li><code>{`{{doctor_name}}`}</code> - Assigned doctor's name</li>
                        <li><code>{`{{clinic_name}}`}</code> - Your clinic name</li>
                        <li><code>{`{{appointment_time}}`}</code> - Appointment time slot</li>
                      </ul>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">7</span>
                    <div>
                      <strong>Set Language:</strong> Choose the language for your template. You can create multiple versions of the same template in different languages for diverse patient populations.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">8</span>
                    <div>
                      <strong>Preview Template:</strong> Click the "Preview" button to see how your template will look with sample data. Verify formatting, check variable placement, and ensure the message is clear and professional.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">9</span>
                    <div>
                      <strong>Submit for Approval:</strong> Once satisfied, click "Submit" or "Save & Submit". The template will be sent to the platform provider (WhatsApp/Meta for WhatsApp templates) for review and approval.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">10</span>
                    <div>
                      <strong>Wait for Approval:</strong> Template status changes to "Pending". Approval typically takes 24-48 hours for WhatsApp templates. You'll receive notification once approved or rejected with feedback.
                    </div>
                  </li>
                </ol>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Template Creation Tips:</h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-blue-800">
                  <li>Keep WhatsApp/SMS templates under 160 characters to avoid splitting and extra charges</li>
                  <li>Use clear, professional language that reflects your clinic's brand voice</li>
                  <li>Always include opt-out instructions in marketing templates (legally required)</li>
                  <li>Test all dynamic variables with sample data before submitting</li>
                  <li>Follow WhatsApp Business API guidelines to avoid rejection</li>
                  <li>Create template variations for A/B testing different message formats</li>
                  <li>Use emojis sparingly and only when appropriate for the message tone</li>
                  <li>Include clear call-to-action (CTA) buttons or links where applicable</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> WhatsApp templates require approval from Meta before they can be used. Rejected templates will include feedback explaining what needs to be changed. Common rejection reasons include: promotional content in utility templates, missing opt-out instructions, or unclear variable usage.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">After Submission:</h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-green-800">
                  <li>Template appears in your library with "Pending" status badge</li>
                  <li>You can still edit pending templates if you catch errors</li>
                  <li>Approved templates get green status badge and become available for use</li>
                  <li>Rejected templates show red badge with rejection reason - modify and resubmit</li>
                  <li>Use "Sync Templates" button to fetch latest approval status from platforms</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatesGuide;
