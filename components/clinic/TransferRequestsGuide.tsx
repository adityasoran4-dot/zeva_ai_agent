"use client";
import React from 'react';
import { ClipboardList } from 'lucide-react';

const TransferRequestsGuide: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <ClipboardList className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Transfer Requests</h1>
            <p className="text-gray-600 mt-1">Request stock transfers between locations or branches</p>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-indigo-600" />
            What are Stock Transfer Requests?
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            Stock Transfer Requests allow departments or branches to request inventory from other 
            storage locations. When a location runs low on supplies, they can submit a transfer 
            request to the source location. The request goes through an approval workflow before 
            the actual transfer is executed. This ensures proper authorization and tracking of 
            inter-location stock movements.
          </p>

          {/* Image Section */}
          <div className="w-full bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-300 p-8 my-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                Transfer Requests - Complete Interface
              </h3>
            </div>
            <div className="bg-white rounded-xl border-2 border-indigo-200 overflow-hidden shadow-inner relative group" style={{ minHeight: '550px', maxHeight: '650px' }}>
              <img 
                src="/transfer.png" 
                alt="Transfer Requests Interface" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-transfer-req')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-transfer-req hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 text-gray-500">
                <ClipboardList className="w-20 h-20 mb-4 text-indigo-400" />
                <p className="text-xl font-semibold text-indigo-700">Transfer Requests Interface</p>
                <p className="text-sm mt-2 text-indigo-600">Screenshot will appear here when available</p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-indigo-900 mb-2">Key Features:</h4>
            <ul className="space-y-2 text-sm text-indigo-800">
              <li><strong>Multi-Location Support:</strong> Request transfers between any locations</li>
              <li><strong>Approval Workflow:</strong> Manager approval before processing</li>
              <li><strong>Priority Levels:</strong> Mark requests as Urgent, High, Medium, Low</li>
              <li><strong>Availability Check:</strong> System verifies source location has sufficient stock</li>
              <li><strong>Expected Delivery Date:</strong> Set when you need the items</li>
              <li><strong>Partial Fulfillment:</strong> Receive items in multiple shipments</li>
              <li><strong>Status Tracking:</strong> Monitor Pending, Approved, In Transit, Completed</li>
              <li><strong>Cost Allocation:</strong> Track transfer costs between departments</li>
              <li><strong>Auto Notifications:</strong> Alert source location when request is approved</li>
              <li><strong>History & Audit:</strong> Complete record of all transfer requests</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Step-by-Step Guide */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            How to Create Transfer Request
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-5">
            <h4 className="font-semibold text-teal-900 mb-3">Step-by-Step Guide:</h4>
            <ol className="space-y-4 text-sm text-teal-800">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <strong>Navigate to Transfer Requests & Click Create:</strong> Go to Stock Management → Stock Transfer Requests from sidebar. Click "Create Request" button to open the transfer request form.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <strong>Fill Request Details & Create:</strong> Enter Date, select From Branch (source location), choose Requesting Employee, add Items with quantities, and write Notes explaining the transfer need. Once all required fields are completed, click "Create Transfer Request" to send for approval.
                </div>
              </li>
            </ol>
          </div>

          {/* Image Upload Section */}
          <div className="w-full bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-dashed border-indigo-400 p-8 my-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h4 className="text-xl font-bold text-indigo-900">Screenshot: How to Create Transfer Request</h4>
            </div>
            <div className="bg-white rounded-xl border-2 border-indigo-200 overflow-hidden relative group" style={{ minHeight: '400px', maxHeight: '500px' }}>
              <img 
                src="/new-transfer.png" 
                alt="How to Create Transfer Request" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-howto-transfer-req')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-howto-transfer-req hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 text-gray-500">
                <svg className="w-16 h-16 mb-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-semibold text-indigo-700">Upload Screenshot Here</p>
                <p className="text-sm mt-2 text-indigo-600">Show the transfer request creation workflow</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferRequestsGuide;
