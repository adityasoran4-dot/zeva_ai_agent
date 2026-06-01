"use client";
import React from 'react';
import { Scale } from 'lucide-react';

const StockAdjustmentGuide: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl shadow-lg">
            <Scale className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Quantity Adjustment</h1>
            <p className="text-gray-600 mt-1">Correct inventory discrepancies and update stock levels</p>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Scale className="w-6 h-6 text-yellow-600" />
            What is Stock Quantity Adjustment?
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            Stock Quantity Adjustment allows you to manually correct inventory levels when physical 
            counts differ from system records. This happens due to damages, losses, theft, counting 
            errors, or unrecorded transactions. Each adjustment requires a reason code and approval 
            to maintain audit trails and prevent unauthorized stock changes.
          </p>

          {/* Image Section */}
          <div className="w-full bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-300 p-8 my-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-yellow-600 rounded-lg">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                Stock Adjustment - Complete Interface
              </h3>
            </div>
            <div className="bg-white rounded-xl border-2 border-yellow-200 overflow-hidden shadow-inner relative group" style={{ minHeight: '550px', maxHeight: '650px' }}>
              <img 
                src="/stock.png" 
                alt="Stock Adjustment Interface" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-adjustment')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-adjustment hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 to-orange-100 text-gray-500">
                <Scale className="w-20 h-20 mb-4 text-yellow-400" />
                <p className="text-xl font-semibold text-yellow-700">Stock Adjustment Interface</p>
                <p className="text-sm mt-2 text-yellow-600">Screenshot will appear here when available</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-yellow-900 mb-2">Key Features:</h4>
            <ul className="space-y-2 text-sm text-yellow-800">
              <li><strong>Positive/Negative Adjustments:</strong> Increase or decrease stock quantities</li>
              <li><strong>Reason Codes:</strong> Categorize adjustments (Damage, Loss, Found, Count Error)</li>
              <li><strong>Approval Workflow:</strong> Manager approval required for large adjustments</li>
              <li><strong>Audit Trail:</strong> Complete history of who adjusted what and why</li>
              <li><strong>Batch-Specific:</strong> Adjust specific batches if needed</li>
              <li><strong>Location-Based:</strong> Adjust stock at specific storage locations</li>
              <li><strong>Value Impact:</strong> See financial impact of adjustments</li>
              <li><strong>Bulk Adjustments:</strong> Adjust multiple items in one transaction</li>
              <li><strong>Threshold Alerts:</strong> Flag unusual quantity changes</li>
              <li><strong>Integration:</strong> Syncs with accounting for write-offs</li>
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
            How to Adjust Stock Quantity
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-5">
            <h4 className="font-semibold text-teal-900 mb-3">Step-by-Step Guide:</h4>
            <ol className="space-y-4 text-sm text-teal-800">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <strong>Navigate to Adjustment & Select Items:</strong> Go to Stock Management → Stock Qty Adjustment from sidebar. Click "Create Adjustment" button. Search and select products that need quantity correction.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <strong>Enter Adjustment Details & Save:</strong> Enter new quantity or adjustment amount (+/-). Select reason code (Damage, Loss, etc.). Add notes explaining the discrepancy. Click "Save Adjustment" to update stock levels after approval.
                </div>
              </li>
            </ol>
          </div>

          {/* Image Upload Section */}
          <div className="w-full bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border-2 border-dashed border-yellow-400 p-8 my-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h4 className="text-xl font-bold text-yellow-900">Screenshot: How to Adjust Stock Quantity</h4>
            </div>
            <div className="bg-white rounded-xl border-2 border-yellow-200 overflow-hidden relative group" style={{ minHeight: '500px', maxHeight: '600px' }}>
              <img 
                src="/new-stock.png" 
                alt="How to Adjust Stock Quantity" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-howto-adjustment')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-howto-adjustment hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 text-gray-500">
                <svg className="w-16 h-16 mb-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-semibold text-yellow-700">Upload Screenshot Here</p>
                <p className="text-sm mt-2 text-yellow-600">Show the stock adjustment workflow</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustmentGuide;
