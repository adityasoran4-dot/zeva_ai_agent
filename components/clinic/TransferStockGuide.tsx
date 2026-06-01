"use client";
import React from 'react';
import { Truck } from 'lucide-react';

const TransferStockGuide: React.FC = () => {
  return (
    <div className="max-w-9xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl shadow-lg">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transfer Stock</h1>
            <p className="text-gray-600 mt-1">Execute approved stock transfers between locations</p>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-cyan-600" />
            What is Transfer Stock?
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            Transfer Stock is the actual execution of moving inventory from one location to another 
            after a transfer request has been approved. The source location prepares and dispatches 
            the items, updates quantities as "In Transit", and the destination location receives and 
            confirms the delivery. This process ensures accurate tracking during movement and updates 
            stock levels at both locations once completed.
          </p>

          {/* Image Section */}
          <div className="w-full bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl border-2 border-cyan-300 p-8 my-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-cyan-600 rounded-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                Transfer Stock - Complete Interface
              </h3>
            </div>
            <div className="bg-white rounded-xl border-2 border-cyan-200 overflow-hidden shadow-inner relative group" style={{ minHeight: '550px', maxHeight: '650px' }}>
              <img
                src="/transfer1.png" 
                alt="Transfer Stock Interface" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-transfer')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-transfer hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-cyan-100 to-blue-100 text-gray-500">
                <Truck className="w-20 h-20 mb-4 text-cyan-400" />
                <p className="text-xl font-semibold text-cyan-700">Transfer Stock Interface</p>
                <p className="text-sm mt-2 text-cyan-600">Screenshot will appear here when available</p>
              </div>
            </div>
          </div>

          <div className="bg-cyan-50 border-l-4 border-cyan-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-cyan-900 mb-2">Key Features:</h4>
            <ul className="space-y-2 text-sm text-cyan-800">
              <li><strong>Link to Approved Request:</strong> Execute against approved transfer requests</li>
              <li><strong>Picking List:</strong> Generate list for warehouse staff to collect items</li>
              <li><strong>Dispatch Confirmation:</strong> Record when items leave source location</li>
              <li><strong>In Transit Tracking:</strong> Monitor items during transportation</li>
              <li><strong>Delivery Receipt:</strong> Destination confirms receipt of items</li>
              <li><strong>Partial Transfers:</strong> Send items in multiple shipments if needed</li>
              <li><strong>Condition Notes:</strong> Document item condition at dispatch and receipt</li>
              <li><strong>Auto Stock Update:</strong> Decrease source, increase destination automatically</li>
              <li><strong>Transport Details:</strong> Record vehicle, driver, and estimated arrival</li>
              <li><strong>Signature Capture:</strong> Digital signatures for dispatch and delivery</li>
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
            How to Transfer Stock
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-5">
            <h4 className="font-semibold text-teal-900 mb-3">Step-by-Step Guide:</h4>
            <ol className="space-y-4 text-sm text-teal-800">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <strong>Navigate to Transfer Stock & Select Request:</strong> Go to Stock Management → Transfer Stock from sidebar. Find approved transfer request. Click "Process Transfer" button. Verify items and quantities to be transferred.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <strong>Dispatch & Confirm Transfer:</strong> Source location picks and packs items. Enter dispatch date, transport details, and expected delivery. Click "Dispatch" to mark as In Transit. Destination receives and clicks "Confirm Receipt" to complete transfer and update stock levels.
                </div>
              </li>
            </ol>
          </div>

          {/* Image Upload Section */}
          <div className="w-full bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl border-2 border-dashed border-cyan-400 p-8 my-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h4 className="text-xl font-bold text-cyan-900">Screenshot: How to Transfer Stock</h4>
            </div>
            <div className="bg-white rounded-xl border-2 border-cyan-200 overflow-hidden relative group" style={{ minHeight: '400px', maxHeight: '500px' }}>
              <img 
                src="/transfer-stock-process.png" 
                alt="How to Transfer Stock" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-howto-transfer')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-howto-transfer hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-50 text-gray-500">
                <svg className="w-16 h-16 mb-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-semibold text-cyan-700">Upload Screenshot Here</p>
                <p className="text-sm mt-2 text-cyan-600">Show the stock transfer execution workflow</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferStockGuide;
