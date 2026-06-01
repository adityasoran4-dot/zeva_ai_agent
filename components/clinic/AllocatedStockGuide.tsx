"use client";
import React from 'react';
import { Lock } from 'lucide-react';

const AllocatedStockGuide: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-slate-500 to-gray-600 rounded-xl shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Allocated Stock Items</h1>
            <p className="text-gray-600 mt-1">Reserve inventory for specific appointments or orders</p>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Lock className="w-6 h-6 text-slate-600" />
            What are Allocated Stock Items?
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            Allocated Stock Items are inventory quantities that have been reserved for specific 
            patient appointments, scheduled procedures, or pending orders but not yet consumed. 
            Allocation prevents these items from being used by others, ensuring availability when 
            needed. Once the appointment occurs and items are actually used, allocations convert 
            to consumptions. If appointments are cancelled, allocations are released back to 
            available stock.
          </p>

          {/* Image Section */}
          <div className="w-full bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl border-2 border-slate-300 p-8 my-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-600 rounded-lg">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                Allocated Stock - Complete Interface
              </h3>
            </div>
            <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden shadow-inner relative group" style={{ minHeight: '550px', maxHeight: '650px' }}>
              <img 
                src="/allocate.png" 
                alt="Allocated Stock Interface" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-allocated')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-allocated hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-gray-100 text-gray-500">
                <Lock className="w-20 h-20 mb-4 text-slate-400" />
                <p className="text-xl font-semibold text-slate-700">Allocated Stock Interface</p>
                <p className="text-sm mt-2 text-slate-600">Screenshot will appear here when available</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border-l-4 border-slate-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-slate-900 mb-2">Key Features:</h4>
            <ul className="space-y-2 text-sm text-slate-800">
              <li><strong>Appointment-Based Allocation:</strong> Reserve items for upcoming appointments</li>
              <li><strong>Treatment Templates:</strong> Auto-allocate standard items for specific treatments</li>
              <li><strong>Availability Protection:</strong> Prevents allocated items from being used elsewhere</li>
              <li><strong>Release on Cancellation:</strong> Free up stock when appointments are cancelled</li>
              <li><strong>Convert to Consumption:</strong> Auto-convert allocations to actual usage after appointment</li>
              <li><strong>Partial Allocation:</strong> Allocate only what's available if insufficient stock</li>
              <li><strong>Expiry Checking:</strong> Ensure allocated items won't expire before appointment</li>
              <li><strong>Allocation Reports:</strong> View all reserved stock across appointments</li>
              <li><strong>Doctor Requests:</strong> Doctors can request specific materials in advance</li>
              <li><strong>Time-Bound Reservations:</strong> Allocations expire if appointment is rescheduled</li>
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
            How to Allocate Stock Items
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-5">
            <h4 className="font-semibold text-teal-900 mb-3">Step-by-Step Guide:</h4>
            <ol className="space-y-4 text-sm text-teal-800">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <strong>Navigate to Allocated Stock & Select Appointment:</strong> Go to Stock Management → Allocated Stock Items from sidebar. Click "Allocate Items" button. Select the upcoming patient appointment or procedure requiring materials.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <strong>Select Items & Confirm Allocation:</strong> System suggests standard items for treatment type. Add/modify quantities as needed. Check stock availability. Click "Allocate" to reserve items for the appointment. Items show as "Allocated" until appointment date when they convert to consumptions.
                </div>
              </li>
            </ol>
          </div>

          {/* Image Upload Section */}
          <div className="w-full bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl border-2 border-dashed border-slate-400 p-8 my-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h4 className="text-xl font-bold text-slate-900">Screenshot: How to Allocate Stock Items</h4>
            </div>
            <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden relative group" style={{ minHeight: '600px', maxHeight: '700px' }}>
              <img 
                src="/new-all.png" 
                alt="How to Allocate Stock Items" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-howto-allocated')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-howto-allocated hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-gray-50 text-gray-500">
                <svg className="w-16 h-16 mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-semibold text-slate-700">Upload Screenshot Here</p>
                <p className="text-sm mt-2 text-slate-600">Show the stock allocation workflow</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllocatedStockGuide;
