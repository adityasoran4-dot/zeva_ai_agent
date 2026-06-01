"use client";
import React from 'react';
import { 
  DollarSign, 
  CreditCard, 
  Receipt, 
  MousePointer2,
  Info,
  CheckCircle,
  Package,
  Brain,
  Wallet,
  FileText,
  ClipboardList,
  History,
  Trash2,
  BarChart3,
  Image as ImageIcon
} from 'lucide-react';

const PrescriptionsBillingWorkflowGuide: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-8 px-6 sm:px-8 lg:px-12 text-white">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">Prescriptions & Extras - Billing Integration Guide</h1>
          <p className="text-blue-100 text-sm mt-2 opacity-90">Complete workflow for appointment billing, payment processing, and financial tracking.</p>
        </div>
      </div>

      {/* UI Preview Section - Top Cards + Screenshot */}
      <div className="w-full border-b border-gray-200 px-6 sm:px-8 lg:px-12 py-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <MousePointer2 className="w-6 h-6 text-blue-600" />
            Billing Dashboard Overview
          </h2>
          
          {/* First Row: Three Small Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Card 1: Total Billing Summary */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-green-900">Billing Summary</h3>
              </div>
              <ul className="space-y-2 text-sm text-green-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Total amount due and paid status</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Real-time calculation of services</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Pending balance tracking</span>
                </li>
              </ul>
            </div>

            {/* Card 2: Quick Actions */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-blue-900">Quick Actions</h3>
              </div>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Add treatment packages instantly</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Process multiple payment methods</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Split payments (Cash + Card)</span>
                </li>
              </ul>
            </div>

            {/* Card 3: Payment History */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-purple-900">Payment History</h3>
              </div>
              <ul className="space-y-2 text-sm text-purple-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span>Complete transaction logs</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span>Communication tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span>Export and print receipts</span>
                </li>
              </ul>
            </div>
          </div>

          {/* New Section: Two Image Cards Stacked Vertically */}
          <div className="space-y-6 mb-8">
            {/* Row 1: App Screenshot */}
            <div className="aspect-video bg-white rounded-xl border-2 border-blue-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-lg hover:shadow-xl transition-shadow duration-300">
              <img 
                src="/app.png" 
                alt="App Interface" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-content-app')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-content-app hidden absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-gray-700 font-semibold">App Interface</p>
                <p className="text-gray-500 text-xs mt-2">/app.png</p>
              </div>
            </div>

            {/* Row 2: Report Screenshot */}
            <div className="aspect-video bg-white rounded-xl border-2 border-purple-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-lg hover:shadow-xl transition-shadow duration-300">
              <img 
                src="/report.png" 
                alt="Report View" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-content-report')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-content-report hidden absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-gray-700 font-semibold">Report View</p>
                <p className="text-gray-500 text-xs mt-2">/report.png</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Explanation Section */}
      <div className="w-full px-6 sm:px-8 lg:px-12 py-8">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Section 1: How Billing Modal Works */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Info className="w-6 h-6 text-blue-600" />
              How the Appointment Billing Modal Works
            </h2>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <p className="text-gray-700 leading-relaxed mb-6">
                The Appointment Billing Modal is a comprehensive financial management tool integrated within the appointment workflow. 
                It enables clinical staff to manage all billing aspects of a patient's visit in one centralized interface.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Adding Treatment Packages */}
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
                  <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    Adding Treatment Packages
                  </h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span><strong>Quick Selection:</strong> Choose from pre-configured treatment bundles tailored to specific procedures</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span><strong>Service Linking:</strong> Automatically associate clinical services performed during the session</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span><strong>Resource Tracking:</strong> Link consumed medications and supplies, auto-deducting from inventory</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span><strong>Dynamic Pricing:</strong> System calculates total costs based on selected packages and services</span>
                    </li>
                  </ul>
                </div>

                {/* Managing Payment Details */}
                <div className="bg-green-50 rounded-lg p-6 border border-green-100">
                  <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-green-600" />
                    Managing Payment Details
                  </h3>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      <span><strong>Multiple Payment Methods:</strong> Accept cash, card, UPI, insurance, or combination payments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      <span><strong>Split Payments:</strong> Divide payment across multiple methods (e.g., partial cash + partial card)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      <span><strong>Real-time Calculation:</strong> Automatic computation of paid amount, pending balance, and change due</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      <span><strong>Payment Reference:</strong> Add transaction IDs, notes, or invoice numbers for tracking</span>
                    </li>
                  </ul>
                </div>

                {/* Viewing Payment History */}
                <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
                  <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                    <History className="w-5 h-5 text-purple-600" />
                    Viewing Payment History
                  </h3>
                  <ul className="space-y-2 text-sm text-purple-800">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">•</span>
                      <span><strong>Complete Transaction Log:</strong> Access full history of all payments made for this appointment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">•</span>
                      <span><strong>Detailed Breakdown:</strong> View date, amount, payment method, and staff member who processed each transaction</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">•</span>
                      <span><strong>Communication Logs:</strong> Track all billing-related communications sent to patient (SMS, email, WhatsApp)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">•</span>
                      <span><strong>Export Options:</strong> Download or print detailed payment receipts and statements</span>
                    </li>
                  </ul>
                </div>

                {/* Tracking Communication Logs */}
                <div className="bg-orange-50 rounded-lg p-6 border border-orange-100">
                  <h3 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-600" />
                    Tracking Communication Logs
                  </h3>
                  <ul className="space-y-2 text-sm text-orange-800">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold">•</span>
                      <span><strong>Automated Notifications:</strong> System sends payment confirmations via SMS/email automatically</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold">•</span>
                      <span><strong>Manual Communications:</strong> Send custom payment reminders or follow-ups directly from modal</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold">•</span>
                      <span><strong>Status Updates:</strong> Patient receives real-time updates on payment status and outstanding balances</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold">•</span>
                      <span><strong>Audit Trail:</strong> Complete record of all communications for compliance and reference</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Advanced Features */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-600" />
              Advanced Features
            </h2>

            <div className="space-y-6">
              {/* Smart Recommendations */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-purple-200 p-8">
                <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-3">
                  <Brain className="w-6 h-6 text-purple-600" />
                  Smart Recommendations
                </h3>
                <p className="text-purple-800 mb-4 leading-relaxed">
                  AI-powered suggestions that enhance billing accuracy and optimize revenue capture:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white/60 rounded-lg p-4 border border-purple-100">
                    <h4 className="font-semibold text-purple-800 mb-2 text-sm">Department-Based Suggestions</h4>
                    <p className="text-xs text-purple-700">System recommends common services and packages based on the doctor's specialization and patient's complaint history.</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-4 border border-purple-100">
                    <h4 className="font-semibold text-purple-800 mb-2 text-sm">Historical Pattern Analysis</h4>
                    <p className="text-xs text-purple-700">Analyzes similar past appointments to suggest appropriate treatments and prevent missed billing items.</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-4 border border-purple-100">
                    <h4 className="font-semibold text-purple-800 mb-2 text-sm">Revenue Optimization</h4>
                    <p className="text-xs text-purple-700">Identifies underutilized services or commonly forgotten charges to maximize legitimate revenue.</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-4 border border-purple-100">
                    <h4 className="font-semibold text-purple-800 mb-2 text-sm">Compliance Alerts</h4>
                    <p className="text-xs text-purple-700">Notifies staff about required consents, insurance pre-authorizations, or documentation before billing.</p>
                  </div>
                </div>
              </div>

              {/* Active Packages Visibility */}
              <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl border border-teal-200 p-8">
                <h3 className="font-bold text-teal-900 mb-4 flex items-center gap-3">
                  <Package className="w-6 h-6 text-teal-600" />
                  Active Packages Visibility
                </h3>
                <p className="text-teal-800 mb-4 leading-relaxed">
                  Real-time visibility into patient's purchased package benefits and utilization:
                </p>
                <ul className="space-y-2 text-sm text-teal-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Package Status:</strong> Instantly see if patient has active wellness plans, membership packages, or prepaid treatments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Session Tracking:</strong> View number of sessions utilized vs. remaining sessions in package</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Auto-Application:</strong> System automatically applies package benefits and adjusts billing accordingly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Expiry Alerts:</strong> Notifications about packages nearing expiration to encourage timely utilization</span>
                  </li>
                </ul>
              </div>

              {/* Multi-Payment Support with Split Payments */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 p-8">
                <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  Multi-Payment Support & Split Payments
                </h3>
                <p className="text-blue-800 mb-4 leading-relaxed">
                  Flexible payment options allowing patients to use multiple payment methods in a single transaction:
                </p>
                
                <div className="bg-white rounded-lg p-6 border border-blue-100 mb-4">
                  <h4 className="font-semibold text-blue-800 mb-3">How Split Payments Work:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
                    <li><strong>Enable Multiple Payments:</strong> Toggle "Use Multiple Payments" switch in billing modal</li>
                    <li><strong>Add Payment Methods:</strong> Click "Add Payment" to create additional payment rows</li>
                    <li><strong>Distribute Amount:</strong> Enter amounts for each method (e.g., $50 Cash + $100 Card = $150 Total)</li>
                    <li><strong>Select Methods:</strong> Choose from dropdown: Cash, Card, UPI, Insurance, Cheque, etc.</li>
                    <li><strong>Auto-Balance:</strong> System shows remaining balance to allocate across methods</li>
                    <li><strong>Process Transaction:</strong> Complete payment - system generates separate receipts for each method</li>
                  </ol>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-blue-100/50 rounded-lg p-4 border border-blue-200">
                    <p className="text-xs font-bold text-blue-700 mb-2">Example Scenario</p>
                    <p className="text-[11px] text-blue-600">Total Bill: $200<br/>Pay $80 Cash + $120 Card<br/>Both processed together</p>
                  </div>
                  <div className="bg-blue-100/50 rounded-lg p-4 border border-blue-200">
                    <p className="text-xs font-bold text-blue-700 mb-2">Insurance Co-pay</p>
                    <p className="text-[11px] text-blue-600">Insurance: $150<br/>Patient pays: $50 copay<br/>Split handles both</p>
                  </div>
                  <div className="bg-blue-100/50 rounded-lg p-4 border border-blue-200">
                    <p className="text-xs font-bold text-blue-700 mb-2">Partial Advance</p>
                    <p className="text-[11px] text-blue-600">Advance paid: $100<br/>Remaining: $100 at visit<br/>Combined settlement</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: All Appointments Page Actions */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 pt-4">
              <ClipboardList className="w-6 h-6 text-blue-600" />
              All Appointments Page - Action Menu
            </h2>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <p className="text-gray-700 leading-relaxed mb-6">
                From the main Scheduled Appointments list, clicking the <strong>Vertical Dots (⋮)</strong> menu provides quick access to essential appointment management functions:
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Appointment History */}
                <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-600" />
                    Appointment History
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>View complete audit trail of all changes made to the appointment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Track rescheduling, cancellations, and status updates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>See which staff members made modifications and when</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Access historical notes and communication logs</span>
                    </li>
                  </ul>
                </div>

                {/* Reports */}
                <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    Reports
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Generate detailed appointment analytics and performance metrics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Export data for accounting, insurance, or compliance purposes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Create custom reports filtered by date, doctor, or service type</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Visual dashboards showing trends and patterns</span>
                    </li>
                  </ul>
                </div>

                {/* Billing */}
                <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Billing
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Open billing modal directly from appointments list</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>View current payment status and outstanding balance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Process payments without opening full appointment details</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Print receipts or send payment links to patients</span>
                    </li>
                  </ul>
                </div>

                {/* Delete Appointment */}
                <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-red-600" />
                    Delete Appointment
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Permanently remove appointment from system</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Confirmation dialog prevents accidental deletions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Deletes associated billing records and communications</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Logs deletion in audit trail for compliance</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: End-to-End Workflow */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              End-to-End Billing Workflow
            </h2>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-8">
              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-900 mb-2">Open Billing from Appointment</h3>
                    <p className="text-sm text-green-800">Navigate to Scheduled Appointments → Click vertical dots (⋮) → Select "Billing" → Modal opens with patient's current charges and payment status.</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-900 mb-2">Add Treatment Packages & Services</h3>
                    <p className="text-sm text-green-800">Review smart recommendations → Select appropriate packages → Add individual services → System auto-calculates total with taxes and discounts.</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-900 mb-2">Apply Active Packages & Insurance</h3>
                    <p className="text-sm text-green-800">System checks for active patient packages → Auto-applies eligible benefits → Deducts from package balance → Adjusts final amount accordingly.</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-900 mb-2">Process Payment (Single or Split)</h3>
                    <p className="text-sm text-green-800">Choose payment method → Enable split payments if needed → Enter amounts for each method → Process transaction → System generates receipts.</p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">5</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-900 mb-2">Send Communication & Receipts</h3>
                    <p className="text-sm text-green-800">Automatic SMS/email confirmation → Payment receipt sent to patient → Communication logged in history → Follow-up reminders scheduled if balance pending.</p>
                  </div>
                </div>

                {/* Step 6 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">6</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-900 mb-2">Track Records & Generate Reports</h3>
                    <p className="text-sm text-green-800">Payment appears in patient history → Update reflected in clinic financial reports → Data available for analytics → Export for accounting/tax purposes.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Report Section Workflow */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Report & Documentation Workflow
            </h2>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Step 1: Fill Out Reports
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Clinical Documentation:</strong> Complete treatment notes, procedures performed, and outcomes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Vital Signs Recording:</strong> Document temperature, BP, pulse, and other measurements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Resource Utilization:</strong> List all medications, supplies, and equipment used</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Report Generation:</strong> System compiles data into structured clinical report</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    Step 2: Proceed with Complaints
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Primary Complaint Entry:</strong> Document patient's chief complaints and symptoms</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Progress Notes:</strong> Add detailed observations and clinical findings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Previous History Sync:</strong> Review and reference past complaints for continuity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Treatment Planning:</strong> Outline next steps and follow-up requirements</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Reports must be completed before complaints documentation to ensure all clinical data is captured first. This sequential workflow maintains proper medical record structure and supports accurate billing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionsBillingWorkflowGuide;
