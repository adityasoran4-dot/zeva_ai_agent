"use client";
import React from 'react';
import { Banknote, FileText, Calendar, Filter, DollarSign, Receipt, ListOrdered, Users, AlertCircle, CheckCircle, Info } from 'lucide-react';

const PettyCashWorkflowGuide: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="w-full bg-gradient-to-r from-green-600 to-teal-600 py-8 px-6 sm:px-8 lg:px-12 text-white">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">Petty Cash Management Guide</h1>
          <p className="text-green-100 text-sm mt-2 opacity-90">Track cash transactions, manage expenses, and monitor clinic cash flow efficiently.</p>
        </div>
      </div>

      {/* UI Preview Section - Petty Cash Screen */}
      <div className="w-full border-b border-gray-200 px-6 sm:px-8 lg:px-12 py-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Banknote className="w-6 h-6 text-green-600" />
            Petty Cash Dashboard
          </h2>

          <div className="w-full bg-green-50 rounded-xl border border-green-200 p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Petty Cash Interface
            </h3>
            <div className="bg-white rounded-lg border-2 border-green-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
              <img 
                src="/petty.png" 
                alt="Petty Cash Screen" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-petty-cash')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-petty-cash hidden text-center p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Banknote className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-gray-600 font-medium">Image not found: /petty-cash-screen.png</p>
                <p className="text-gray-400 text-sm mt-2">Please ensure petty-cash-screen.png is in the public folder.</p>
              </div>
            </div>
          </div>

          {/* Detailed Explanation Section */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Info className="w-6 h-6 text-green-600" />
              Petty Cash Features Breakdown
            </h2>

            {/* Section 1: Transaction Details Table */}
            <div className="bg-white rounded-xl p-6 border-l-4 border-green-500 shadow-sm">
              <h4 className="font-bold text-green-800 mb-4 flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5" />
                1. Transaction Details Table
              </h4>
              <p className="text-gray-600 mb-4 leading-relaxed">
                The main table displays all cash payment records with comprehensive transaction details for easy tracking and reconciliation.
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">•</span>
                  <div><strong>Invoice Number:</strong> Unique invoice identifier displayed in monospace font with invoiced staff name for accountability.</div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">•</span>
                  <div><strong>Date:</strong> Transaction date formatted in DD-MMM-YYYY format (e.g., 15-Jan-2024) for easy reading.</div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">•</span>
                  <div><strong>Patient Information:</strong> Patient name with EMR number and mobile number for quick identification and contact.</div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">•</span>
                  <div><strong>Service/Item Type:</strong> Categorized as Treatment, Package, or Membership with color-coded badges and detailed breakdown including selected treatments and sessions.</div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">•</span>
                  <div><strong>Payment Breakdown:</strong> Shows multiple payment methods if split payment was used (Cash, Card, etc.) with individual amounts.</div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">•</span>
                  <div><strong>Total Billed Amount:</strong> Complete invoice amount before any payments applied.</div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">•</span>
                  <div><strong>Cash Received:</strong> Actual cash amount collected highlighted in green for quick visual identification.</div>
                </li>
              </ul>
            </div>

            {/* Section 2: Summary Cards */}
            <div className="bg-white rounded-xl p-6 border-l-4 border-blue-500 shadow-sm">
              <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5" />
                2. Summary Cards Overview
              </h4>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Four summary cards provide instant visibility into cash flow status at a glance.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-4 text-white">
                  <h5 className="font-bold mb-2 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Total Cash In</h5>
                  <p className="text-sm opacity-90">Combined total of patient cash payments plus manual entries for complete cash visibility.</p>
                </div>
                <div className="bg-white border-2 border-blue-200 rounded-xl p-4">
                  <h5 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><Receipt className="w-4 h-4" /> Patient Cash</h5>
                  <p className="text-sm text-gray-600">Total cash received from patient billing transactions. Clickable to view detailed breakdown drawer.</p>
                </div>
                <div className="bg-white border-2 border-purple-200 rounded-xl p-4">
                  <h5 className="font-bold text-purple-800 mb-2 flex items-center gap-2"><ListOrdered className="w-4 h-4" /> Manual Entries</h5>
                  <p className="text-sm text-gray-600">Sum of manually added petty cash expenses (office supplies, snacks, petrol, etc.). Clickable to view list.</p>
                </div>
                <div className="bg-white border-2 border-orange-200 rounded-xl p-4">
                  <h5 className="font-bold text-orange-800 mb-2 flex items-center gap-2"><Calendar className="w-4 h-4" /> Date Range</h5>
                  <p className="text-sm text-gray-600">Currently selected filter period showing From and To dates for data scope reference.</p>
                </div>
              </div>
            </div>

            {/* Section 3: Filtering Options */}
            <div className="bg-white rounded-xl p-6 border-l-4 border-purple-500 shadow-sm">
              <h4 className="font-bold text-purple-800 mb-4 flex items-center gap-2 text-lg">
                <Filter className="w-5 h-5" />
                3. Advanced Filtering System
              </h4>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Powerful search and date filtering capabilities to quickly locate specific transactions.
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div><strong>Search Functionality:</strong> Real-time search by patient name, invoice number, or EMR number with instant results.</div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div><strong>Date Range Selection:</strong> Flexible "From" and "To" date pickers to filter transactions within specific periods.</div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div><strong>Quick Date Change:</strong> Easily modify date range to view different time periods (daily, weekly, monthly, custom).</div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div><strong>Search Button:</strong> Apply filters manually or press Enter key for quick search execution.</div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div><strong>Reset Filters:</strong> One-click reset button clears all filters and returns to default today's date range.</div>
                </li>
              </ul>
            </div>

            {/* Section 4: Add Petty Cash Feature */}
            <div className="bg-white rounded-xl p-6 border-l-4 border-orange-500 shadow-sm">
              <h4 className="font-bold text-orange-800 mb-4 flex items-center gap-2 text-lg">
                <ListOrdered className="w-5 h-5" />
                4. Manual Petty Cash Entry
              </h4>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Track non-patient cash expenses like office supplies, refreshments, fuel, and other miscellaneous costs.
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div><strong>Add Petty Cash Button:</strong> Prominent green button in header opens slide-out drawer for quick entry.</div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div><strong>Entry Form Fields:</strong> Name (required), Amount in AED (required), and optional Notes for additional context.</div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div><strong>Real-time Validation:</strong> Form validates required fields and amount before submission to prevent errors.</div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div><strong>Success Confirmation:</strong> Green success message appears after successful entry addition.</div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div><strong>Live Total Preview:</strong> Shows updated combined total that will result after adding the entry.</div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div><strong>Common Use Cases:</strong> Office supplies, staff snacks, petrol/fuel, printing costs, maintenance, small purchases.</div>
                </li>
              </ul>
            </div>

            {/* Section 5: Slide-out Drawers */}
            <div className="bg-white rounded-xl p-6 border-l-4 border-indigo-500 shadow-sm">
              <h4 className="font-bold text-indigo-800 mb-4 flex items-center gap-2 text-lg">
                <Users className="w-5 h-5" />
                5. Interactive Detail Drawers
              </h4>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Click on summary cards to open detailed slide-out panels for deeper insights without leaving the page.
              </p>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h5 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><Receipt className="w-4 h-4" /> Patient Cash Drawer</h5>
                  <ul className="text-sm text-gray-700 space-y-1 ml-6">
                    <li>• Displays all patient cash payment records for selected date range</li>
                    <li>• Shows patient name, EMR number, service type, invoice, and date</li>
                    <li>• Color-coded service badges (Treatment=Teal, Package=Blue, Membership=Purple)</li>
                    <li>• Total patient cash amount prominently displayed at top</li>
                    <li>• Scrollable list with record count footer</li>
                  </ul>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h5 className="font-bold text-purple-800 mb-2 flex items-center gap-2"><ListOrdered className="w-4 h-4" /> Manual Entries Drawer</h5>
                  <ul className="text-sm text-gray-700 space-y-1 ml-6">
                    <li>• Lists all manually added petty cash expenses chronologically</li>
                    <li>• Each entry shows name, amount, note, and creation timestamp</li>
                    <li>• Numbered entries for easy reference</li>
                    <li>• Total manual cash sum displayed at top</li>
                    <li>• Quick "Add one now" link if no entries exist</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 6: Pagination */}
            <div className="bg-white rounded-xl p-6 border-l-4 border-teal-500 shadow-sm">
              <h4 className="font-bold text-teal-800 mb-4 flex items-center gap-2 text-lg">
                <AlertCircle className="w-5 h-5" />
                6. Pagination & Navigation
              </h4>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-teal-600 font-bold text-xl">•</span>
                  <div><strong>Records Per Page:</strong> Displays 50 records per page for optimal viewing and performance.</div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-600 font-bold text-xl">•</span>
                  <div><strong>Page Navigation:</strong> Previous/Next buttons with page counter (e.g., "Page 1 / 5") for easy browsing.</div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-600 font-bold text-xl">•</span>
                  <div><strong>Record Count:</strong> Shows current range (e.g., "Showing 1-50 of 237 records") for context.</div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-600 font-bold text-xl">•</span>
                  <div><strong>Page Total:</strong> Footer row displays sum of cash amounts for currently visible page only.</div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PettyCashWorkflowGuide;
