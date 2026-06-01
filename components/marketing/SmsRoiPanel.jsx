import React from "react";
import { X, TrendingUp, DollarSign, Users, MessageSquare } from "lucide-react";

const SmsRoiPanel = ({ open, onClose }) => {
  if (!open) return null;

  // Sample ROI data - in real app, this would come from API
  const roiData = {
    totalSent: 1250,
    totalDelivered: 1180,
    totalClicks: 245,
    totalConversions: 32,
    revenue: 12500,
    cost: 1250,
    roi: ((12500 - 1250) / 1250) * 100,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-2">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-slate-500">SMS Marketing</p>
              <h2 className="text-sm font-bold text-slate-900">ROI Analytics</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition bg-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 space-y-3">
        
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-center gap-1.5 mb-1">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                <p className="text-[9px] font-semibold text-blue-700 uppercase tracking-wide">Total Sent</p>
              </div>
              <p className="text-base font-bold text-blue-900">{roiData.totalSent.toLocaleString()}</p>
              <p className="text-[9px] text-blue-600 mt-0.5">SMS messages</p>
            </div>

            <div className="p-2 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-1.5 mb-1">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <p className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wide">Delivered</p>
              </div>
              <p className="text-base font-bold text-emerald-900">{roiData.totalDelivered.toLocaleString()}</p>
              <p className="text-[9px] text-emerald-600 mt-0.5">
                {((roiData.totalDelivered / roiData.totalSent) * 100).toFixed(1)}% delivery rate
              </p>
            </div>

            <div className="p-2 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                <p className="text-[9px] font-semibold text-purple-700 uppercase tracking-wide">Clicks</p>
              </div>
              <p className="text-base font-bold text-purple-900">{roiData.totalClicks.toLocaleString()}</p>
              <p className="text-[9px] text-purple-600 mt-0.5">
                {((roiData.totalClicks / roiData.totalDelivered) * 100).toFixed(1)}% CTR
              </p>
            </div>

            <div className="p-2 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                <p className="text-[9px] font-semibold text-amber-700 uppercase tracking-wide">Conversions</p>
              </div>
              <p className="text-base font-bold text-amber-900">{roiData.totalConversions.toLocaleString()}</p>
              <p className="text-[9px] text-amber-600 mt-0.5">
                {((roiData.totalConversions / roiData.totalClicks) * 100).toFixed(1)}% conversion rate
              </p>
            </div>
          </div>

          {/* ROI Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-[9px] font-semibold text-slate-600 uppercase tracking-wide mb-1">Total Revenue</p>
              <p className="text-lg font-bold text-slate-900">₹{roiData.revenue.toLocaleString()}</p>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-[9px] font-semibold text-slate-600 uppercase tracking-wide mb-1">Total Cost</p>
              <p className="text-lg font-bold text-slate-900">₹{roiData.cost.toLocaleString()}</p>
            </div>

            <div className="p-2.5 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border-2 border-emerald-300">
              <p className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wide mb-1">ROI</p>
              <p className="text-lg font-bold text-emerald-900">{roiData.roi.toFixed(1)}%</p>
              <p className="text-[9px] text-emerald-700 mt-0.5">Return on Investment</p>
            </div>
          </div>

          {/* Performance Chart Placeholder */}
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs font-semibold text-slate-800 mb-2">Performance Over Time</p>
            <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-300 rounded-md">
              <p className="text-slate-500 text-[10px]">Chart visualization would appear here</p>
            </div>
          </div>
        </div>

        <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold shadow hover:bg-blue-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmsRoiPanel;

