"use client";
import React from 'react';
import { TrendingDown } from 'lucide-react';

const ConsumptionsGuide: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl shadow-lg">
            <TrendingDown className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Consumptions</h1>
            <p className="text-gray-600 mt-1">Track stock usage for treatments and procedures</p>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-pink-600" />
            What are Consumptions?
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            Consumptions track the actual usage of medical supplies, medications, and materials 
            during patient treatments and procedures. When doctors use items like syringes, bandages, 
            implants, or medications, these are recorded as consumptions that automatically reduce 
            inventory levels. This ensures accurate stock tracking, cost allocation to patients, 
            and automatic reordering when supplies run low.
          </p>

          {/* Image Section */}
          <div className="w-full bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border-2 border-pink-300 p-8 my-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-pink-600 rounded-lg">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                Consumptions - Complete Interface
              </h3>
            </div>
            <div className="bg-white rounded-xl border-2 border-pink-200 overflow-hidden shadow-inner relative group" style={{ minHeight: '550px', maxHeight: '650px' }}>
              <img 
                src="/consumptions.png" 
                alt="Consumptions Interface" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-consumption')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-consumption hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 to-rose-100 text-gray-500">
                <TrendingDown className="w-20 h-20 mb-4 text-pink-400" />
                <p className="text-xl font-semibold text-pink-700">Consumptions Interface</p>
                <p className="text-sm mt-2 text-pink-600">Screenshot will appear here when available</p>
              </div>
            </div>
          </div>

          <div className="bg-pink-50 border-l-4 border-pink-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-pink-900 mb-2">Key Features:</h4>
            <ul className="space-y-2 text-sm text-pink-800">
              <li><strong>Patient-Based Tracking:</strong> Link consumptions to specific patient appointments</li>
              <li><strong>Treatment Integration:</strong> Auto-suggest items based on treatment type</li>
              <li><strong>Real-Time Stock Update:</strong> Immediately reduce inventory when consumed</li>
              <li><strong>Cost Calculation:</strong> Calculate total material costs per patient</li>
              <li><strong>Batch Tracking:</strong> Record which batches were used for traceability</li>
              <li><strong>Expiry Monitoring:</strong> Alert if expired items are being consumed</li>
              <li><strong>Doctor Attribution:</strong> Track which doctor used which materials</li>
              <li><strong>Billing Integration:</strong> Auto-add consumed items to patient invoices</li>
              <li><strong>Usage Analytics:</strong> Analyze consumption patterns by treatment/doctor</li>
              <li><strong>Reorder Triggers:</strong> Auto-generate purchase requests when stock is low</li>
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
            How to Record Consumptions
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-5">
            <h4 className="font-semibold text-teal-900 mb-3">Step-by-Step Guide:</h4>
            <ol className="space-y-4 text-sm text-teal-800">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <strong>Navigate to Consumptions & Select Patient:</strong> Go to Stock Management → Consumptions from sidebar. Click "Record Consumption" button. Select the patient appointment or treatment session where materials were used.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <strong>Add Consumed Items & Save:</strong> Search and add products used with quantities. System shows available stock and batch details. Verify quantities and add notes if needed. Click "Save Consumption" to record usage, update stock levels, and add to patient billing.
                </div>
              </li>
            </ol>
          </div>

          {/* Image Upload Section */}
          <div className="w-full bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border-2 border-dashed border-pink-400 p-8 my-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h4 className="text-xl font-bold text-pink-900">Screenshot: How to Record Consumptions</h4>
            </div>
            <div className="bg-white rounded-xl border-2 border-pink-200 overflow-hidden relative group" style={{ minHeight: '400px', maxHeight: '500px' }}>
              <img 
                src="/consumption-record.png" 
                alt="How to Record Consumptions" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-howto-consumption')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-howto-consumption hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 to-rose-50 text-gray-500">
                <svg className="w-16 h-16 mb-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-semibold text-pink-700">Upload Screenshot Here</p>
                <p className="text-sm mt-2 text-pink-600">Show the consumption recording workflow</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsumptionsGuide;
