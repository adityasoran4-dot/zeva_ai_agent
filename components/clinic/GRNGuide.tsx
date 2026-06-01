"use client";
import React from 'react';
import { PackageCheck } from 'lucide-react';

const GRNGuide: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl shadow-lg">
            <PackageCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">GRN - Goods Received Note</h1>
            <p className="text-gray-600 mt-1">Record and verify incoming deliveries from suppliers</p>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-green-600" />
            What is GRN (Goods Received Note)?
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            A Goods Received Note (GRN) is a document created when stock is delivered from a supplier 
            against a Purchase Order. The GRN records what was actually received, verifies quantities 
            and quality, notes any discrepancies or damages, and updates inventory levels in the system. 
            It's a critical document for three-way matching (PO + GRN + Invoice) before payment processing.
          </p>

          {/* Image Section */}
          <div className="w-full bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl border-2 border-green-300 p-8 my-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-600 rounded-lg">
                <PackageCheck className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                GRN Management - Complete Interface
              </h3>
            </div>
            <div className="bg-white rounded-xl border-2 border-green-200 overflow-hidden shadow-inner relative group" style={{ minHeight: '550px', maxHeight: '650px' }}>
              <img 
                src="/grn.png" 
                alt="GRN Management Complete Interface" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-grn')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-grn hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-green-100 to-teal-100 text-gray-500">
                <PackageCheck className="w-20 h-20 mb-4 text-green-400" />
                <p className="text-xl font-semibold text-green-700">GRN Management Interface</p>
                <p className="text-sm mt-2 text-green-600">Screenshot will appear here when available</p>
                <div className="mt-4 px-4 py-2 bg-green-200 rounded-lg text-xs text-green-800">
                  Expected: /grn.png
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-green-900 mb-2">Key Features:</h4>
            <ul className="space-y-2 text-sm text-green-800">
              <li><strong>Link to PO:</strong> GRN is always linked to a specific Purchase Order</li>
              <li><strong>Quantity Verification:</strong> Record actual quantities received vs ordered</li>
              <li><strong>Quality Inspection:</strong> Note product condition, damages, or defects</li>
              <li><strong>Batch & Expiry Tracking:</strong> Enter batch numbers and expiry dates for traceability</li>
              <li><strong>Location Assignment:</strong> Specify where received items are stored</li>
              <li><strong>Discrepancy Recording:</strong> Document shortages, overages, or wrong items</li>
              <li><strong>Auto Stock Update:</strong> System automatically increases inventory levels</li>
              <li><strong>Partial Receiving:</strong> Receive items in multiple deliveries against one PO</li>
              <li><strong>Digital Signature:</strong> Receiver signs off on delivery acceptance</li>
              <li><strong>Three-Way Matching:</strong> Enables PO-GRN-Invoice verification for payments</li>
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
            How to Create GRN
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-5">
            <h4 className="font-semibold text-teal-900 mb-3">Step-by-Step Guide:</h4>
            <ol className="space-y-4 text-sm text-teal-800">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <strong>Navigate to GRN & Select PO:</strong> Go to Stock Management → GRN from sidebar. Find the Purchase Order with "Confirmed" status that has pending delivery. Click "Create GRN" button.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <strong>Verify Delivery & Save:</strong> Check delivered items against PO. Enter actual quantities received, batch numbers, expiry dates, and storage location. Note any damages or discrepancies. Click "Save GRN" to complete receiving and update stock levels.
                </div>
              </li>
            </ol>
          </div>

          {/* Image Upload Section */}
          <div className="w-full bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl border-2 border-dashed border-green-400 p-8 my-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h4 className="text-xl font-bold text-green-900">Screenshot: How to Create GRN</h4>
            </div>
            <div className="bg-white rounded-xl border-2 border-green-200 overflow-hidden relative group" style={{ minHeight: '400px', maxHeight: '500px' }}>
              <img 
                src="/grn-add.png" 
                alt="How to Create GRN" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-howto-grn')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-howto-grn hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-teal-50 text-gray-500">
                <svg className="w-16 h-16 mb-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-semibold text-green-700">Upload Screenshot Here</p>
                <p className="text-sm mt-2 text-green-600">Show the GRN creation and receiving workflow</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GRNGuide;
