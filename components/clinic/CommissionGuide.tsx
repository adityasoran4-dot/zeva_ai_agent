"use client";
import React, { useState } from "react";
import { DollarSign, Users, FileText } from "lucide-react";

const CommissionGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <DollarSign className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Commission Tracker - Complete Guide
              </h1>
              <p className="text-teal-100 text-sm">
                Comprehensive guide for managing referral and doctor/staff
                commissions
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-teal-100 text-xs mb-1">
                Track Commissions From
              </p>
              <p className="text-white font-semibold">
                Referrals & Doctor/Staff
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-teal-100 text-xs mb-1">Commission Types</p>
              <p className="text-white font-semibold">
                Percentage-Based Earnings
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-teal-100 text-xs mb-1">Actions Available</p>
              <p className="text-white font-semibold">
                View, Track, Approve, Manage
              </p>
            </div>
          </div>
        </div>

        {/* Quick Navigation Tabs */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Quick Navigation - Complete Details of All Sections
          </h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { id: "overview", label: " Overview (Introduction)", icon: FileText },
              { id: "modal", label: " Detailed Modal View", icon: Users },
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  activeSection === section.id
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <section.icon className="w-5 h-5 text-teal-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {section.label}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-semibold mb-2">
              🎯 Key Points:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1 text-xs text-blue-700">
              <li>
                <strong>Two Commission Sources:</strong> Referral (external
                referrers) and Doctor/Staff (internal staff commissions)
              </li>
              <li>
                <strong>Commission Tracking:</strong> Track percentage-based
                earnings for each person
              </li>
              <li>
                <strong>Approval System:</strong> Review and approve submitted
                commissions before payment
              </li>
              <li>
                <strong>Detailed History:</strong> View complete breakdown of
                all commission transactions per person
              </li>
              <li>
                <strong>Real-time Updates:</strong> Earned, Paid, and Pending
                amounts update automatically
              </li>
            </ul>
          </div>
        </div>

        {/* Overview Section */}
        {activeSection === "overview" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border-l-4 border-teal-500 p-6 rounded-r-lg">
              <div className="ml-10 space-y-4">
                <p className="text-base text-teal-800 leading-relaxed">
                  The Commission Tracker is a comprehensive financial management
                  tool that helps clinics track, manage, and approve commissions
                  earned by referrers (external partners) and doctor/staff
                  members (internal team). This system ensures transparent
                  commission tracking and timely payments.
                </p>

                <div className="bg-white rounded-lg border border-teal-200 p-4">
                  <h5 className="font-semibold text-teal-900 mb-3">
                    💡 What You Can Do:
                  </h5>
                  <ul className="list-disc list-inside space-y-2 text-sm text-teal-700">
                    <li>
                      <strong>View Referral History:</strong> Complete history
                      of all patient referrals with detailed information
                    </li>
                    <li>
                      <strong>Check Doctor/Staff Details:</strong> Comprehensive
                      data on treatments performed by each doctor
                    </li>
                    <li>
                      <strong>Click View Button:</strong> Opens complete modal
                      showing all transactions and patient details
                    </li>
                    <li>
                      <strong>Track Commissions:</strong> Monitor earned, paid,
                      and pending amounts in real-time
                    </li>
                    <li>
                      <strong>Approve Payments:</strong> Bulk approve submitted
                      commissions for payment processing
                    </li>
                    <li>
                      <strong>Generate Reports:</strong> Access detailed
                      breakdowns for accounting and auditing
                    </li>
                  </ul>
                </div>
                
                {/* Image Section - Overview */}
                <div className="w-full bg-teal-50 rounded-xl border border-teal-200 p-6 mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Commission Tracker Overview
                  </h3>
                  <div className="bg-white rounded-lg border-2 border-teal-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '400px', maxHeight: '500px' }}>
                    <img 
                      src="/comm.png" 
                      alt="Commission Tracker Overview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement?.querySelector('.placeholder-overview')?.classList.remove('hidden');
                      }}
                    />
                    <div className="placeholder-overview hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-50 text-gray-500">
                      <DollarSign className="w-16 h-16 mb-4 text-teal-300" />
                      <p className="text-lg font-medium">Commission Tracker Overview</p>
                      <p className="text-sm mt-2">Screenshot will appear here</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal View Section - Enhanced */}
        {activeSection === "modal" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 p-6 rounded-r-lg">
              <h4 className="font-bold text-lg text-orange-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8text-white rounded-full text-sm font-bold"></span>
                View Button - Complete Referral History & Doctor/Staff Details
              </h4>
              <div className="ml-10 space-y-4">
                <p className="text-base text-orange-800 leading-relaxed">
                  When you click the <strong>"View"</strong> button, a
                  comprehensive modal opens showing complete referral history
                  for external partners or detailed commission information for
                  doctors and staff. This provides full transparency into all
                  commission activities.
                </p>

                {/* Image Section - Detailed Modal View */}
                <div className="w-full bg-orange-50 rounded-xl border border-orange-200 p-6 mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Detailed Modal View - Complete Referral History
                  </h3>
                  <div className="bg-white rounded-lg border-2 border-orange-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                    <img 
                      src="/doc1.png" 
                      alt="Commission Modal View" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement?.querySelector('.placeholder-modal')?.classList.remove('hidden');
                      }}
                    />
                    <div className="placeholder-modal hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 text-gray-500">
                      <Users className="w-16 h-16 mb-4 text-orange-300" />
                      <p className="text-lg font-medium">Detailed Modal View</p>
                      <p className="text-sm mt-2">Screenshot will appear here</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg border border-orange-200 p-4">
                  <h5 className="font-semibold text-orange-900 mb-3">
                    📋 What You Can See When Clicking View:
                  </h5>
                  <div className="space-y-4">
                    <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
                      <h6 className="font-semibold text-orange-900 mb-2">
                        For Referral Partners (External):
                      </h6>
                      <ul className="list-disc list-inside ml-5 space-y-2 text-sm text-orange-700">
                        <li>
                          <strong>Complete Referral History:</strong> All
                          patients referred with dates and treatments
                        </li>
                        <li>
                          <strong>Patient Details:</strong> Name, contact info,
                          patient ID for each referral
                        </li>
                        <li>
                          <strong>Treatment Information:</strong> Specific
                          services/procedures performed
                        </li>
                        <li>
                          <strong>Commission Breakdown:</strong> Individual
                          earnings per referral
                        </li>
                        <li>
                          <strong>Payment Status:</strong> Submitted, approved,
                          or paid status for each commission
                        </li>
                        <li>
                          <strong>Total Earnings Summary:</strong> Cumulative
                          commission earned from all referrals
                        </li>
                      </ul>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                      <h6 className="font-semibold text-purple-900 mb-2">
                        For Doctors/Staff (Internal):
                      </h6>
                      <ul className="list-disc list-inside ml-5 space-y-2 text-sm text-purple-700">
                        <li>
                          <strong>Complete Treatment History:</strong> All
                          procedures performed by the doctor
                        </li>
                        <li>
                          <strong>Patient List:</strong> Names and details of
                          all patients treated
                        </li>
                        <li>
                          <strong>Service Details:</strong> Specific medical
                          services provided
                        </li>
                        <li>
                          <strong>Commission Per Treatment:</strong> Earnings
                          from each procedure
                        </li>
                        <li>
                          <strong>Performance Metrics:</strong> Total patients,
                          total earnings, averages
                        </li>
                        <li>
                          <strong>Department Data:</strong> Treatments
                          categorized by specialty
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-orange-200 p-4">
                  <h5 className="font-semibold text-orange-900 mb-3">
                    🔍 Detailed Information Displayed in Modal:
                  </h5>
                  <div className="space-y-3">
                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                      <p className="font-semibold text-orange-900 mb-2 text-sm">
                        Patient Information:
                      </p>
                      <ul className="list-disc list-inside ml-5 space-y-1 text-xs text-orange-700">
                        <li>Full name of patient who received treatment</li>
                        <li>Patient ID for system reference</li>
                        <li>Contact details (phone, email)</li>
                        <li>Treatment date when service was performed</li>
                      </ul>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                      <p className="font-semibold text-orange-900 mb-2 text-sm">
                        Treatment & Commission Details:
                      </p>
                      <ul className="list-disc list-inside ml-5 space-y-1 text-xs text-orange-700">
                        <li>Treatment type - specific procedure or service</li>
                        <li>Treatment cost - total amount charged</li>
                        <li>Commission percentage applied</li>
                        <li>Commission amount earned (Cost × %)</li>
                        <li>Current status (Submitted → Approved → Paid)</li>
                      </ul>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                      <p className="font-semibold text-orange-900 mb-2 text-sm">
                        Additional Information:
                      </p>
                      <ul className="list-disc list-inside ml-5 space-y-1 text-xs text-orange-700">
                        <li>Membership plans purchased by patient</li>
                        <li>Package usage and remaining sessions</li>
                        <li>Notes or special circumstances</li>
                        <li>Payment timeline and history</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h5 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                    📊 Example Data View:
                  </h5>
                  <div className="bg-white rounded-lg p-3 border border-orange-200 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-orange-200">
                          <th className="text-left py-2 px-2">Name</th>
                          <th className="text-left py-2 px-2">Type</th>
                          <th className="text-left py-2 px-2">Earned</th>
                          <th className="text-left py-2 px-2">Paid</th>
                          <th className="text-left py-2 px-2">Comm %</th>
                          <th className="text-left py-2 px-2">Count</th>
                          <th className="text-left py-2 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-orange-100">
                          <td className="py-2 px-2">Ahmed Al M.</td>
                          <td className="py-2 px-2">Referral</td>
                          <td className="py-2 px-2">AED 10,000</td>
                          <td className="py-2 px-2">AED 10,000</td>
                          <td className="py-2 px-2">10%</td>
                          <td className="py-2 px-2">56</td>
                          <td className="py-2 px-2">View & Approve</td>
                        </tr>
                        <tr className="border-b border-orange-100">
                          <td className="py-2 px-2">Fatima Hassan</td>
                          <td className="py-2 px-2">Referral</td>
                          <td className="py-2 px-2">AED 10,000</td>
                          <td className="py-2 px-2">AED 20,000</td>
                          <td className="py-2 px-2">20%</td>
                          <td className="py-2 px-2">56</td>
                          <td className="py-2 px-2">View & Approve</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2">Mohammed Ali</td>
                          <td className="py-2 px-2">Referral</td>
                          <td className="py-2 px-2">AED 10,000</td>
                          <td className="py-2 px-2">AED 10,000</td>
                          <td className="py-2 px-2">10%</td>
                          <td className="py-2 px-2">56</td>
                          <td className="py-2 px-2">View & Approve</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-orange-200 p-4">
                  <h5 className="font-semibold text-orange-900 mb-3">
                    💡 Key Benefits:
                  </h5>
                  <ul className="list-disc list-inside space-y-2 text-sm text-orange-700">
                    <li>
                      <strong>Complete Transparency:</strong> See every
                      transaction with full details
                    </li>
                    <li>
                      <strong>Patient Verification:</strong> Confirm
                      referred/treated patients exist
                    </li>
                    <li>
                      <strong>Accurate Calculations:</strong> Verify commission
                      amounts are correct
                    </li>
                    <li>
                      <strong>Audit Trail:</strong> Complete historical record
                      for compliance
                    </li>
                    <li>
                      <strong>Dispute Resolution:</strong> Answer questions with
                      concrete data
                    </li>
                    <li>
                      <strong>Performance Analysis:</strong> Evaluate
                      contribution of each person
                    </li>
                    <li>
                      <strong>Payment Reconciliation:</strong> Match commissions
                      with bank transfers
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other sections placeholders for tabs, table, actions, workflow */}
        {activeSection === "tabs" && (
          <div className="bg-white rounded-lg p-8 text-center border-2 border-dashed border-teal-300">
            <p className="text-teal-700 font-semibold">
              Source Tabs Section - Content coming soon
            </p>
          </div>
        )}

        {activeSection === "table" && (
          <div className="bg-white rounded-lg p-8 text-center border-2 border-dashed border-teal-300">
            <p className="text-teal-700 font-semibold">
              Table Columns Section - Content coming soon
            </p>
          </div>
        )}

        {activeSection === "actions" && (
          <div className="bg-white rounded-lg p-8 text-center border-2 border-dashed border-teal-300">
            <p className="text-teal-700 font-semibold">
              Action Buttons Section - Content coming soon
            </p>
          </div>
        )}

        {activeSection === "workflow" && (
          <div className="bg-white rounded-lg p-8 text-center border-2 border-dashed border-teal-300">
            <p className="text-teal-700 font-semibold">
              Workflow Section - Content coming soon
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommissionGuide;
