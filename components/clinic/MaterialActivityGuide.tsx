"use client";
import React from 'react';
import { Activity } from 'lucide-react';

const MaterialActivityGuide: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl shadow-lg">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Material Activity</h1>
            <p className="text-gray-600 mt-1">Track all stock movements and inventory transactions</p>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-violet-600" />
            What is Material Activity?
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            Material Activity provides a complete audit trail of all inventory movements and 
            transactions in your system. Every stock movement - whether it's receiving from suppliers, 
            transferring between locations, consuming for treatments, adjusting quantities, or returning 
            items - is logged with timestamps, user details, and transaction references. This gives you 
            full visibility into where your stock is moving and who is handling it.
          </p>

          {/* Image Section */}
          <div className="w-full bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border-2 border-violet-300 p-8 my-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-violet-600 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                Material Activity - Complete Interface
              </h3>
            </div>
            <div className="bg-white rounded-xl border-2 border-violet-200 overflow-hidden shadow-inner relative group" style={{ minHeight: '550px', maxHeight: '650px' }}>
              <img 
                src="/consumption.png" 
                alt="Material Activity Interface" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-activity')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-activity hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-violet-100 to-purple-100 text-gray-500">
                <Activity className="w-20 h-20 mb-4 text-violet-400" />
                <p className="text-xl font-semibold text-violet-700">Material Activity Interface</p>
                <p className="text-sm mt-2 text-violet-600">Screenshot will appear here when available</p>
              </div>
            </div>
          </div>

          <div className="bg-violet-50 border-l-4 border-violet-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-violet-900 mb-2">Key Features:</h4>
            <ul className="space-y-2 text-sm text-violet-800">
              <li><strong>Complete Transaction History:</strong> View all stock movements chronologically</li>
              <li><strong>Filter by Date Range:</strong> Analyze activity for specific periods</li>
              <li><strong>Product-Level Tracking:</strong> See all movements for individual items</li>
              <li><strong>Location-Based View:</strong> Monitor activity at specific storage areas</li>
              <li><strong>User Activity Log:</strong> Track who performed each transaction</li>
              <li><strong>Transaction Types:</strong> Filter by Purchase, Transfer, Consumption, Adjustment, Return</li>
              <li><strong>Quantity Changes:</strong> See before/after stock levels for each movement</li>
              <li><strong>Reference Documents:</strong> Link to related POs, GRNs, invoices, transfers</li>
              <li><strong>Export Reports:</strong> Download activity logs for audits</li>
              <li><strong>Real-Time Updates:</strong> Live feed of stock movements as they happen</li>
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
            How to View Material Activity
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-5">
            <h4 className="font-semibold text-teal-900 mb-3">Step-by-Step Guide:</h4>
            <ol className="space-y-4 text-sm text-teal-800">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <strong>Navigate to Material Activity:</strong> Go to Stock Management → Material Activity from sidebar. View the complete list of all stock transactions. Use filters to narrow down by date range, product, location, or transaction type.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <strong>Analyze & Export Activity:</strong> Review transaction details including quantities, users, timestamps, and reference documents. Click on any transaction to see full details. Use export button to download activity reports for auditing or analysis purposes.
                </div>
              </li>
            </ol>
          </div>

          {/* Image Upload Section */}
          <div className="w-full bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border-2 border-dashed border-violet-400 p-8 my-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h4 className="text-xl font-bold text-violet-900">Screenshot: How to View Material Activity</h4>
            </div>
            <div className="bg-white rounded-xl border-2 border-violet-200 overflow-hidden relative group" style={{ minHeight: '600px', maxHeight: '700px' }}>
              <img 
                src="/cons1.png" 
                alt="How to View Material Activity" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-howto-activity')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-howto-activity hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-violet-50 to-purple-50 text-gray-500">
                <svg className="w-16 h-16 mb-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-semibold text-violet-700">Upload Screenshot Here</p>
                <p className="text-sm mt-2 text-violet-600">Show the material activity tracking interface</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialActivityGuide;
