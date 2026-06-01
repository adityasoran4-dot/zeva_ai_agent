"use client";
import React from 'react';
import { RotateCcw } from 'lucide-react';

const PurchaseReturnsGuide: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-red-500 to-orange-600 rounded-xl shadow-lg">
            <RotateCcw className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase Returns</h1>
            <p className="text-gray-600 mt-1">Return defective or incorrect items to suppliers</p>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-red-600" />
            What are Purchase Returns?
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            Purchase Returns allow you to send back items to suppliers due to defects, damages, 
            wrong deliveries, expired products, or quality issues. The system creates a Return 
            Note that reduces inventory levels, generates credit notes from suppliers, and tracks 
            return reasons for supplier performance evaluation. This ensures accurate stock records 
            and proper financial adjustments.
          </p>

          {/* Image Section */}
          <div className="w-full bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border-2 border-red-300 p-8 my-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-600 rounded-lg">
                <RotateCcw className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                Purchase Returns - Complete Interface
              </h3>
            </div>
            <div className="bg-white rounded-xl border-2 border-red-200 overflow-hidden shadow-inner relative group" style={{ minHeight: '550px', maxHeight: '650px' }}>
              <img 
                src="/return.png" 
                alt="Purchase Returns Interface" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-returns')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-returns hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-red-100 to-orange-100 text-gray-500">
                <RotateCcw className="w-20 h-20 mb-4 text-red-400" />
                <p className="text-xl font-semibold text-red-700">Purchase Returns Interface</p>
                <p className="text-sm mt-2 text-red-600">Screenshot will appear here when available</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-red-900 mb-2">Key Features:</h4>
            <ul className="space-y-2 text-sm text-red-800">
              <li><strong>Return Reasons:</strong> Categorize returns (Defective, Wrong Item, Expired, Damaged)</li>
              <li><strong>Link to GRN/PO:</strong> Connect returns to original purchase documents</li>
              <li><strong>Credit Note Generation:</strong> Auto-create supplier credit memos</li>
              <li><strong>Stock Reduction:</strong> Automatically decrease inventory quantities</li>
              <li><strong>Quality Documentation:</strong> Attach photos and inspection reports</li>
              <li><strong>Approval Workflow:</strong> Manager approval before processing returns</li>
              <li><strong>Refund Tracking:</strong> Monitor refund status and amounts</li>
              <li><strong>Supplier Performance:</strong> Track return rates per supplier</li>
              <li><strong>Batch Tracking:</strong> Return specific batches with expiry issues</li>
              <li><strong>Replacement Orders:</strong> Convert returns to replacement POs</li>
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
            How to Create Purchase Return
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-5">
            <h4 className="font-semibold text-teal-900 mb-3">Step-by-Step Guide:</h4>
            <ol className="space-y-4 text-sm text-teal-800">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <strong>Navigate to Returns & Select Items:</strong> Go to Stock Management → Purchase Returns from sidebar. Click "Create Return" button. Select items to return from existing GRNs or manually enter product details.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <strong>Enter Return Details & Save:</strong> Specify Branch, Supplier, Purchase Order, Date, and Notes. Add photos if needed. System auto-calculates credit amount. Click "Add Return" to process and generate return documentation.
                </div>
              </li>
            </ol>
          </div>

          {/* Image Upload Section */}
          <div className="w-full bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border-2 border-dashed border-red-400 p-8 my-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h4 className="text-xl font-bold text-red-900">Screenshot: How to Create Purchase Return</h4>
            </div>
            <div className="bg-white rounded-xl border-2 border-red-200 overflow-hidden relative group" style={{ minHeight: '400px', maxHeight: '500px' }}>
              <img 
                src="/return1.png" 
                alt="How to Create Purchase Return" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-howto-return')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-howto-return hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 text-gray-500">
                <svg className="w-16 h-16 mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-semibold text-red-700">Upload Screenshot Here</p>
                <p className="text-sm mt-2 text-red-600">Show the purchase return creation workflow</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseReturnsGuide;
