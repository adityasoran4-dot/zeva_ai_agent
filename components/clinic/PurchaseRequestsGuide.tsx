"use client";
import React from 'react';
import { FileText } from 'lucide-react';

const PurchaseRequestsGuide: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl shadow-lg">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase Requests - Internal Requisitions</h1>
            <p className="text-gray-600 mt-1">Create and manage internal stock replenishment requests</p>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-orange-600" />
            What are Purchase Requests?
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            Purchase Requests (PR) are internal documents created by clinic staff to request 
            stock replenishment from the procurement department. When inventory falls below 
            minimum levels or departments need supplies, they submit a purchase request detailing 
            required items, quantities, and urgency. These requests go through an approval workflow 
            before being converted into formal Purchase Orders sent to suppliers.
          </p>

          {/* Dedicated Image Section */}
          <div className="w-full bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border-2 border-orange-300 p-8 my-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-600 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                Purchase Requests - Complete Interface
              </h3>
            </div>
            <div className="bg-white rounded-xl border-2 border-orange-200 overflow-hidden shadow-inner relative group" style={{ minHeight: '550px', maxHeight: '650px' }}>
              <img 
                src="/purchase.png" 
                alt="Purchase Requests Complete Interface" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-pr')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-pr hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-orange-100 to-red-100 text-gray-500">
                <FileText className="w-20 h-20 mb-4 text-orange-400" />
                <p className="text-xl font-semibold text-orange-700">Purchase Requests Interface</p>
                <p className="text-sm mt-2 text-orange-600">Screenshot will appear here when available</p>
                <div className="mt-4 px-4 py-2 bg-orange-200 rounded-lg text-xs text-orange-800">
                  Expected: /purchase-requests.png
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-orange-700">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                This shows the complete purchase request creation and approval workflow
              </span>
              <span className="text-xs bg-orange-100 px-3 py-1 rounded-full">Stock Management Module</span>
            </div>
          </div>

          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-orange-900 mb-2">Key Features:</h4>
            <ul className="space-y-2 text-sm text-orange-800">
              <li><strong>Internal Requisitions:</strong> Staff request stock from procurement department</li>
              <li><strong>Multi-Level Approval:</strong> Configurable approval workflow (Department Head → Store Manager → Finance)</li>
              <li><strong>Priority Levels:</strong> Urgent, High, Medium, Low priority classification</li>
              <li><strong>Budget Checking:</strong> Verify available budget before approval</li>
              <li><strong>Auto-Generation:</strong> Create requests automatically from low stock alerts</li>
              <li><strong>Status Tracking:</strong> Draft, Pending Approval, Approved, Rejected, Converted to PO</li>
              <li><strong>Item Details:</strong> Product name, quantity, UOM, estimated cost, required date</li>
              <li><strong>Justification:</strong> Reason for request and supporting documentation</li>
              <li><strong>Department Allocation:</strong> Charge costs to specific departments</li>
              <li><strong>History & Audit Trail:</strong> Complete record of all requests and approvals</li>
            </ul>
          </div>
        </div>
      </div>

      {/* What You Can See Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Purchase Request Details & Fields
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Basic Request Information */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-3">📋 Basic Information</h4>
              <ul className="space-y-2 text-sm text-orange-800">
                <li><strong>Request Number *:</strong> Auto-generated unique ID (PR-2024-001)</li>
                <li><strong>Request Date *:</strong> Date request is created</li>
                <li><strong>Requested By *:</strong> Staff member creating the request</li>
                <li><strong>Department *:</strong> Department making the request (Dental, Lab, Pharmacy)</li>
                <li><strong>Priority *:</strong> Urgent, High, Medium, Low</li>
                <li><strong>Required Date *:</strong> When items are needed by</li>
              </ul>
            </div>

            {/* Items Requested */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">📦 Items Requested</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li><strong>Product Name *:</strong> Item being requested</li>
                <li><strong>Product Code:</strong> SKU or item code</li>
                <li><strong>Quantity *:</strong> Amount needed</li>
                <li><strong>Unit of Measurement *:</strong> PCS, BOX, LTR, KG, etc.</li>
                <li><strong>Estimated Unit Price:</strong> Expected cost per unit</li>
                <li><strong>Total Estimated Cost:</strong> Quantity × Unit Price</li>
              </ul>
            </div>

            {/* Justification & Notes */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-3">📝 Justification & Notes</h4>
              <ul className="space-y-2 text-sm text-purple-800">
                <li><strong>Reason for Request:</strong> Why items are needed (Low stock, New project, Replacement)</li>
                <li><strong>Detailed Description:</strong> Specifications, brand preferences, quality requirements</li>
                <li><strong>Supporting Documents:</strong> Attach quotes, specifications, images if needed</li>
                <li><strong>Special Instructions:</strong> Delivery location, handling requirements</li>
                <li><strong>Budget Code:</strong> Cost center or budget allocation reference</li>
              </ul>
            </div>

            {/* Approval Workflow */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-3">✅ Approval Workflow</h4>
              <ul className="space-y-2 text-sm text-green-800">
                <li><strong>Current Status:</strong> Draft, Pending, Approved, Rejected, Converted</li>
                <li><strong>Approver Level 1:</strong> Department Head (initial approval)</li>
                <li><strong>Approver Level 2:</strong> Store Manager (stock verification)</li>
                <li><strong>Approver Level 3:</strong> Finance Manager (budget approval)</li>
                <li><strong>Approval Comments:</strong> Notes from approvers with reasons</li>
                <li><strong>Approval Dates:</strong> Timestamp for each approval stage</li>
              </ul>
            </div>
          </div>

          {/* Priority Levels Explanation */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h4 className="font-semibold text-emerald-900 mb-3">🚨 Priority Levels Definition</h4>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-3 border-l-4 border-red-500">
                <p className="font-semibold text-red-900 mb-2">🔴 Urgent</p>
                <ul className="text-xs text-red-700 space-y-1">
                  <li>• Required within 24 hours</li>
                  <li>• Critical for patient care</li>
                  <li>• Stock completely depleted</li>
                  <li>• Emergency situations</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-orange-500">
                <p className="font-semibold text-orange-900 mb-2">🟠 High</p>
                <ul className="text-xs text-orange-700 space-y-1">
                  <li>• Required within 2-3 days</li>
                  <li>• Stock below minimum level</li>
                  <li>• Scheduled procedures need it</li>
                  <li>• Important but not critical</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-yellow-500">
                <p className="font-semibold text-yellow-900 mb-2">🟡 Medium</p>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• Required within 1 week</li>
                  <li>• Regular restocking</li>
                  <li>• Adequate buffer stock exists</li>
                  <li>• Standard replenishment</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-blue-500">
                <p className="font-semibold text-blue-900 mb-2">🔵 Low</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Required within 2 weeks</li>
                  <li>• Future planning</li>
                  <li>• Non-essential items</li>
                  <li>• Budget permitting</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Example Purchase Request */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h4 className="font-semibold text-indigo-900 mb-3">📄 Example Purchase Request</h4>
            <div className="bg-white rounded-lg p-4 border border-indigo-200">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-indigo-100">
                    <td className="py-2 px-3 font-semibold text-indigo-900 w-1/3">Request Number:</td>
                    <td className="py-2 px-3 text-indigo-800">PR-2024-045</td>
                  </tr>
                  <tr className="border-b border-indigo-100">
                    <td className="py-2 px-3 font-semibold text-indigo-900">Requested By:</td>
                    <td className="py-2 px-3 text-indigo-800">Dr. Sarah Ahmed (Dental Department)</td>
                  </tr>
                  <tr className="border-b border-indigo-100">
                    <td className="py-2 px-3 font-semibold text-indigo-900">Priority:</td>
                    <td className="py-2 px-3"><span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">High</span></td>
                  </tr>
                  <tr className="border-b border-indigo-100">
                    <td className="py-2 px-3 font-semibold text-indigo-900">Required Date:</td>
                    <td className="py-2 px-3 text-indigo-800">15-Apr-2024</td>
                  </tr>
                  <tr className="border-b border-indigo-100">
                    <td className="py-2 px-3 font-semibold text-indigo-900">Items:</td>
                    <td className="py-2 px-3 text-indigo-800">
                      <div className="space-y-2">
                        <div className="flex justify-between border-b border-indigo-50 pb-1">
                          <span>• Dental Gloves (Box) - Qty: 20 @ 50 AED</span>
                          <span className="font-semibold">1,000 AED</span>
                        </div>
                        <div className="flex justify-between border-b border-indigo-50 pb-1">
                          <span>• Face Masks (Box) - Qty: 15 @ 30 AED</span>
                          <span className="font-semibold">450 AED</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• Anesthetic Solution (Vial) - Qty: 50 @ 15 AED</span>
                          <span className="font-semibold">750 AED</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-indigo-100">
                    <td className="py-2 px-3 font-semibold text-indigo-900">Total Estimated Cost:</td>
                    <td className="py-2 px-3 text-indigo-800 font-bold">2,200 AED</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-indigo-900">Reason:</td>
                    <td className="py-2 px-3 text-indigo-800">Stock below minimum level. Urgent requirement for scheduled dental procedures next week. Current stock: 3 boxes gloves, 2 boxes masks.</td>
                  </tr>
                </tbody>
              </table>
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
            How to Create Purchase Requests
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            Creating purchase requests is a straightforward process. Follow these steps to 
            request stock replenishment efficiently and ensure timely approval.
          </p>

          <div className="bg-teal-50 border border-teal-200 rounded-lg p-5">
            <h4 className="font-semibold text-teal-900 mb-3">Step-by-Step Guide:</h4>
            <ol className="space-y-4 text-sm text-teal-800">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <strong>Navigate to Purchase Requests:</strong> Go to Stock Management → Purchase Requests from sidebar. View existing requests and their status.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <strong>Create New Request:</strong> Click "New Purchase Request" or "Create PR" button. A form opens with sections for header information and line items.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <div>
                  <strong>Fill Header Details:</strong> Select your department, set priority (Urgent/High/Medium/Low), enter required delivery date. System auto-fills request number and date.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <div>
                  <strong>Add Line Items:</strong> Click "Add Item" button. Search and select products from catalog. Enter quantity needed and verify unit of measurement. System shows current stock level and estimated price.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                <div>
                  <strong>Provide Justification:</strong> Write clear reason for request. Explain why items are needed, reference low stock alerts if applicable, mention any urgent procedures requiring supplies.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">6</span>
                <div>
                  <strong>Attach Supporting Documents:</strong> Upload quotations, product specifications, images, or any relevant files that support your request. This helps approvers make informed decisions.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">7</span>
                <div>
                  <strong>Review & Submit:</strong> Double-check all items, quantities, and total cost. Ensure priority and required date are accurate. Click "Submit for Approval" to send request through workflow.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">8</span>
                <div>
                  <strong>Track Approval Status:</strong> Monitor request status in dashboard. You'll see which approver currently has it and any comments they've added. System sends email notifications at each stage.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">9</span>
                <div>
                  <strong>Respond to Queries:</strong> If approvers have questions or request changes, they'll add comments. Respond promptly with clarifications or modify request as needed and resubmit.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">10</span>
                <div>
                  <strong>Approved - Converted to PO:</strong> Once fully approved, procurement team converts your request to Purchase Order and sends to supplier. You'll receive confirmation with expected delivery date.
                </div>
              </li>
            </ol>
          </div>

          {/* Image Upload Section - How to Create Purchase Requests */}
          <div className="w-full bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border-2 border-dashed border-orange-400 p-8 my-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h4 className="text-xl font-bold text-orange-900">Screenshot: How to Create Purchase Requests</h4>
            </div>
            <div className="bg-white rounded-xl border-2 border-orange-200 overflow-hidden relative group" style={{ minHeight: '500px', maxHeight: '600px' }}>
              <img 
                src="/add-pur.png" 
                alt="How to Create Purchase Requests Step by Step" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-howto-pr')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-howto-pr hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 text-gray-500">
                <svg className="w-16 h-16 mb-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-semibold text-orange-700">Upload Screenshot Here</p>
                <p className="text-sm mt-2 text-orange-600">Show the purchase request creation and approval workflow</p>
                <div className="mt-4 px-4 py-2 bg-orange-100 rounded-lg text-xs text-orange-800">
                  Expected: /how-to-create-purchase-requests.png
                </div>
              </div>
            </div>
           
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Best Practices for Purchase Requests:</h4>
            <ul className="list-disc list-inside space-y-2 text-sm text-blue-800">
              <li><strong>Plan Ahead:</strong> Submit requests before stock runs critically low to avoid urgent premiums</li>
              <li><strong>Accurate Quantities:</strong> Order based on actual consumption patterns, not guesswork</li>
              <li><strong>Clear Justification:</strong> Provide detailed reasons to speed up approval process</li>
              <li><strong>Consolidate Items:</strong> Combine multiple items in one request instead of separate requests</li>
              <li><strong>Realistic Dates:</strong> Set required dates considering supplier lead times</li>
              <li><strong>Check Budget:</strong> Verify department budget availability before submitting</li>
              <li><strong>Follow Up:</strong> Contact approvers if request is pending beyond expected timeframe</li>
              <li><strong>Learn from Rejections:</strong> Understand why requests are rejected to improve future submissions</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> Purchase requests directly impact clinic operations and patient care. Delayed or incomplete requests can lead to stockouts, cancelled appointments, and revenue loss. Always submit requests with sufficient lead time and provide complete, accurate information to facilitate quick approvals.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">Approval Workflow Stages:</h4>
            <div className="space-y-3 mt-3">
              <div className="bg-white rounded-lg p-3 border-l-4 border-blue-500">
                <p className="font-semibold text-blue-900 mb-1">Stage 1: Department Head Review</p>
                <ul className="list-disc list-inside ml-5 space-y-1 text-xs text-blue-700">
                  <li>Verifies items are necessary for department operations</li>
                  <li>Confirms quantities align with actual needs</li>
                  <li>Checks department budget availability</li>
                  <li>Approves or rejects with comments</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg p-3 border-l-4 border-purple-500">
                <p className="font-semibold text-purple-900 mb-1">Stage 2: Store Manager Verification</p>
                <ul className="list-disc list-inside ml-5 space-y-1 text-xs text-purple-700">
                  <li>Checks current stock levels across all locations</li>
                  <li>Verifies items aren't already ordered</li>
                  <li>Suggests alternative products if available</li>
                  <li>Confirms or adjusts quantities</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg p-3 border-l-4 border-orange-500">
                <p className="font-semibold text-orange-900 mb-1">Stage 3: Finance Approval</p>
                <ul className="list-disc list-inside ml-5 space-y-1 text-xs text-orange-700">
                  <li>Reviews total cost against budget</li>
                  <li>Verifies pricing is competitive</li>
                  <li>Ensures proper cost center allocation</li>
                  <li>Gives final financial approval</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg p-3 border-l-4 border-green-500">
                <p className="font-semibold text-green-900 mb-1">Stage 4: Procurement Processing</p>
                <ul className="list-disc list-inside ml-5 space-y-1 text-xs text-green-700">
                  <li>Selects appropriate supplier</li>
                  <li>Converts PR to Purchase Order</li>
                  <li>Negotiates pricing if needed</li>
                  <li>Sends PO to supplier for fulfillment</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseRequestsGuide;
