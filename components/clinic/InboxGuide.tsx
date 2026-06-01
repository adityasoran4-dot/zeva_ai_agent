"use client";
import React from 'react';
import { Mail, MessageSquare, Users } from 'lucide-react';

const InboxGuide: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inbox - Unified Communication Hub</h1>
            <p className="text-gray-600 mt-1">Manage all customer conversations across WhatsApp, Email, and SMS in one place</p>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            What is the Inbox?
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            The Inbox is your centralized communication hub where you can manage all patient and lead 
            conversations across multiple channels. Whether it's WhatsApp messages, emails, or SMS, 
            everything comes together in one unified interface. This powerful tool helps you track 
            conversations, respond quickly, assign agents, schedule messages, and book appointments 
            directly from the chat interface.
          </p>

          {/* Image Placeholder */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Complete Inbox Interface
            </h3>
            <div className="bg-white rounded-lg border-2 border-blue-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '600px', maxHeight: '700px' }}>
              <img 
                src="/inbox.png" 
                alt="Inbox Overview" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-inbox')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-inbox hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-500">
                <Mail className="w-16 h-16 mb-4 text-blue-300" />
                <p className="text-lg font-medium">Inbox Interface Overview</p>
                <p className="text-sm mt-2">Screenshot will appear here</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Key Features:</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li><strong>Multi-Channel Support:</strong> WhatsApp Business API, Email, and SMS integration</li>
              <li><strong>Real-Time Messaging:</strong> Instant message delivery and read receipts</li>
              <li><strong>Conversation Management:</strong> Organize chats by status (Open, Pending, Closed, etc.)</li>
              <li><strong>Agent Assignment:</strong> Assign conversations to specific team members</li>
              <li><strong>Template Library:</strong> Quick access to pre-approved message templates</li>
              <li><strong>Appointment Booking:</strong> Book appointments directly from conversation</li>
              <li><strong>Scheduled Messages:</strong> Plan and automate future communications</li>
              <li><strong>Rich Media Support:</strong> Send images, documents, and attachments</li>
              <li><strong>Tagging System:</strong> Categorize conversations with custom tags</li>
              <li><strong>Search & Filter:</strong> Find conversations quickly with advanced filters</li>
            </ul>
          </div>
        </div>
      </div>

      {/* What You Can See Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            What You Can See in the Inbox
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Sidebar - Conversations List */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-3">📋 Conversations List (Left Panel)</h4>
              <ul className="space-y-2 text-sm text-purple-800">
                <li><strong>Total Chat Count:</strong> Shows number of active conversations at the top</li>
                <li><strong>Search Bar:</strong> Search conversations by name, phone, or content</li>
                <li><strong>Status Filters:</strong> Filter by Open, Pending, Closed, Spam, etc.</li>
                <li><strong>Agent Filter:</strong> View conversations assigned to specific agents</li>
                <li><strong>Conversation Cards:</strong> Each shows contact name, last message preview, timestamp</li>
                <li><strong>Create New Chat:</strong> Button to start new conversation with any contact</li>
                <li><strong>Infinite Scroll:</strong> Load more conversations as you scroll down</li>
                <li><strong>Unread Indicators:</strong> Visual markers for unread messages</li>
              </ul>
            </div>

            {/* Main Chat Area */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="font-semibold text-indigo-900 mb-3">💬 Chat Window (Center Panel)</h4>
              <ul className="space-y-2 text-sm text-indigo-800">
                <li><strong>Contact Header:</strong> Name, last seen status, provider info</li>
                <strong>Message Timeline:</strong> Chronological view with date separators
                <li><strong>Incoming/Outgoing Messages:</strong> Color-coded bubbles (gray/blue)</li>
                <li><strong>Message Types:</strong> Text, images, documents, templates</li>
                <li><strong>Reply Feature:</strong> Reply to specific messages with context</li>
                <li><strong>WhatsApp Timer:</strong> Countdown for 24-hour response window</li>
                <li><strong>Scroll to Bottom:</strong> Quick navigation button for latest messages</li>
                <li><strong>Loading States:</strong> Skeleton screens while fetching messages</li>
              </ul>
            </div>

            {/* Right Sidebar - Conversation Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-3">ℹ️ Conversation Info (Right Panel)</h4>
              <ul className="space-y-2 text-sm text-green-800">
                <li><strong>Lead Details:</strong> Contact name, phone, email (masked for agents)</li>
                <li><strong>Avatar Display:</strong> Profile picture or initials</li>
                <li><strong>Tags Section:</strong> Add/remove tags to categorize conversation</li>
                <li><strong>Assign Agent:</strong> Dropdown to assign/reassign conversation</li>
                <li><strong>Action Buttons:</strong> Book Appointment, Delete Conversation</li>
                <li><strong>Collapsible Sections:</strong> Expand/collapse different info panels</li>
                <li><strong>Privacy Controls:</strong> Sensitive data masking based on user role</li>
              </ul>
            </div>

            {/* Message Input Area */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-3">✍️ Message Input (Bottom Bar)</h4>
              <ul className="space-y-2 text-sm text-orange-800">
                <li><strong>Text Area:</strong> Multi-line input for composing messages</li>
                <li><strong>Provider Selector:</strong> Choose WhatsApp, Email, or SMS provider</li>
                <li><strong>Templates Button:</strong> Access pre-approved message templates</li>
                <li><strong>Attachment Upload:</strong> Send images, PDFs, documents</li>
                <li><strong>Emoji Picker:</strong> Insert emojis into messages</li>
                <li><strong>Schedule Button:</strong> Plan messages for future delivery</li>
                <li><strong>Send Button:</strong> Immediate message delivery</li>
                <li><strong>Reply Context:</strong> Shows which message you're replying to</li>
              </ul>
            </div>
          </div>

          {/* Provider Selection Details */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h4 className="font-semibold text-emerald-900 mb-3">🔌 Communication Providers</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-3 border-l-4 border-green-500">
                <p className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  WhatsApp
                </p>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• Green icon indicator</li>
                  <li>• 24-hour response window</li>
                  <li>• Template approval required</li>
                  <li>• Rich media support</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-red-500">
                <p className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email
                </p>
                <ul className="text-xs text-red-700 space-y-1">
                  <li>• Red mail icon indicator</li>
                  <li>• HTML formatting support</li>
                  <li>• Attachment capabilities</li>
                  <li>• No time restrictions</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-blue-500">
                <p className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  SMS
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Blue message icon</li>
                  <li>• 160 character limit</li>
                  <li>• Direct delivery</li>
                  <li>• Universal compatibility</li>
                </ul>
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
            How to Use the Inbox
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            The Inbox is designed for efficient communication management. Follow these steps to make 
            the most of this powerful tool and streamline your patient engagement workflow.
          </p>

          <div className="bg-teal-50 border border-teal-200 rounded-lg p-5">
            <h4 className="font-semibold text-teal-900 mb-3">Step-by-Step Guide:</h4>
            <ol className="space-y-4 text-sm text-teal-800">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <strong>Navigate to Inbox:</strong> Go to Marketing → Inbox from the sidebar menu. The inbox loads with all your conversations organized by most recent activity.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <strong>Select a Conversation:</strong> Click on any conversation from the left panel to open the chat window. You'll see the complete message history with the contact.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <div>
                  <strong>Choose Communication Provider:</strong> Before sending, select your provider (WhatsApp, Email, or SMS) from the dropdown in the message input area. Each provider has different capabilities and restrictions.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <div>
                  <strong>Compose Your Message:</strong> Type your message in the text area. You can:
                  <ul className="list-disc list-inside ml-5 mt-2 space-y-1 text-xs">
                    <li>Use templates for quick responses (click Templates button)</li>
                    <li>Add emojis using the emoji picker</li>
                    <li>Attach files (images, PDFs, documents)</li>
                    <li>Reply to specific messages for context</li>
                  </ul>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                <div>
                  <strong>Send or Schedule:</strong> Click the Send button for immediate delivery, or use the Schedule button to plan the message for a future date and time. Scheduled messages are useful for follow-ups and reminders.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">6</span>
                <div>
                  <strong>Assign to Agent:</strong> Use the "Assign to Agent" dropdown in the header to assign the conversation to a specific team member. This helps distribute workload and ensures accountability.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">7</span>
                <div>
                  <strong>Add Tags:</strong> Categorize conversations by adding tags in the right sidebar. Tags help you filter and organize conversations (e.g., "Urgent", "Follow-up Required", "Payment Pending").
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">8</span>
                <div>
                  <strong>Book Appointments:</strong> Click the "Book Appointment" button in the right sidebar to schedule an appointment directly from the conversation. This opens the appointment booking modal with patient details pre-filled.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">9</span>
                <div>
                  <strong>Filter Conversations:</strong> Use the search bar and filter buttons to find specific conversations:
                  <ul className="list-disc list-inside ml-5 mt-2 space-y-1 text-xs">
                    <li>Search by name, phone number, or message content</li>
                    <li>Filter by status (Open, Pending, Closed, Spam)</li>
                    <li>Filter by assigned agent</li>
                    <li>View only unread conversations</li>
                  </ul>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">10</span>
                <div>
                  <strong>Monitor WhatsApp Timer:</strong> For WhatsApp conversations, watch the countdown timer showing remaining time in the 24-hour response window. After this window expires, you can only send template messages.
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Pro Tips for Efficient Inbox Management:</h4>
            <ul className="list-disc list-inside space-y-2 text-sm text-blue-800">
              <li>Use keyboard shortcuts: Enter to send, Shift+Enter for new line</li>
              <li>Create and save frequently used message templates for faster responses</li>
              <li>Set up auto-assignment rules to distribute conversations evenly among agents</li>
              <li>Use tags consistently to enable better filtering and reporting</li>
              <li>Monitor the WhatsApp 24-hour timer to avoid missing response windows</li>
              <li>Schedule follow-up messages during off-hours for better patient engagement</li>
              <li>Regularly clean up closed conversations to keep the inbox organized</li>
              <li>Use the search function to quickly find past conversations and information</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> WhatsApp Business API has a 24-hour messaging window. Once a patient messages you, you have 24 hours to respond freely. After that, you can only send pre-approved template messages until the patient responds again. Always monitor the WhatsApp timer to stay within this window.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">Best Practices:</h4>
            <ul className="list-disc list-inside space-y-2 text-sm text-green-800">
              <li>Respond to patient inquiries within 2-4 hours for optimal engagement</li>
              <li>Use professional language and maintain clinic brand voice</li>
              <li>Always verify patient identity before sharing sensitive information</li>
              <li>Document important decisions or agreements in the conversation</li>
              <li>Escalate complex issues to senior staff when needed</li>
              <li>Keep conversation tags updated for accurate reporting</li>
              <li>Review scheduled messages regularly to ensure timely delivery</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InboxGuide;
