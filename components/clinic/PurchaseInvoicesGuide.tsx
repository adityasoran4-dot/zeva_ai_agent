"use client";
import React from 'react';
import { FileText } from 'lucide-react';

const PurchaseInvoicesGuide: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase Invoices</h1>
            <p className="text-gray-600 mt-1">Process supplier invoices and manage payments</p>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            What are Purchase Invoices?
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            Purchase Invoices are bills received from suppliers for goods or services delivered. 
            The system performs three-way matching by comparing the Invoice against the original 
            Purchase Order and Goods Received Note (GRN) to ensure accuracy before payment approval. 
            This prevents overpayments, duplicate payments, and ensures you only pay for what was ordered and received.
          </p>

          {/* Image Section */}
          <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-300 p-8 my-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-600 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                Purchase Invoices - Complete Interface
              </h3>
            </div>
            <div className="bg-white rounded-xl border-2 border-blue-200 overflow-hidden shadow-inner relative group" style={{ minHeight: '550px', maxHeight: '650px' }}>
              <img 
                src="/invoices.png" 
                alt="Purchase Invoices Interface" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-invoices')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-invoices hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 text-gray-500">
                <FileText className="w-20 h-20 mb-4 text-blue-400" />
                <p className="text-xl font-semibold text-blue-700">Purchase Invoices Interface</p>
                <p className="text-sm mt-2 text-blue-600">Screenshot will appear here when available</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Key Features:</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li><strong>Three-Way Matching:</strong> Auto-match Invoice with PO and GRN</li>
              <li><strong>Discrepancy Alerts:</strong> Flag price or quantity differences</li>
              <li><strong>Tax Calculation:</strong> Automatic VAT/tax computation</li>
              <li><strong>Payment Terms:</strong> Track due dates and payment schedules</li>
              <li><strong>Partial Payments:</strong> Record multiple payment installments</li>
              <li><strong>Currency Support:</strong> Handle multi-currency invoices</li>
              <li><strong>Approval Workflow:</strong> Multi-level invoice approval process</li>
              <li><strong>Payment Status:</strong> Track Paid, Partial, Pending, Overdue</li>
              <li><strong>Document Attachment:</strong> Upload scanned invoice copies</li>
              <li><strong>Accounting Integration:</strong> Sync with financial systems</li>
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
            How to Process Purchase Invoice
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-5">
            <h4 className="font-semibold text-teal-900 mb-3">Step-by-Step Guide:</h4>
            <ol className="space-y-4 text-sm text-teal-800">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <strong>Navigate to Invoices & Create New:</strong> Go to Stock Management → Purchase Invoices from sidebar. Click "Create Invoice" button. Select the related Purchase Order and GRN for automatic data population.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <strong>Enter Invoice Details & Save:</strong> Input Branch, Supplier Name, Date, Status, Supplier Invoice, Notes, and Select GRNs. System auto-matches with PO and GRN. Review three-way match results. Click "Save Changes" to record and initiate approval workflow.
                </div>
              </li>
            </ol>
          </div>

          {/* Image Upload Section */}
          <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-dashed border-blue-400 p-8 my-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h4 className="text-xl font-bold text-blue-900">Screenshot: How to Process Purchase Invoice</h4>
            </div>
            <div className="bg-white rounded-xl border-2 border-blue-200 overflow-hidden relative group" style={{ minHeight: '400px', maxHeight: '500px' }}>
              <img 
                src="/invoice-new.png" 
                alt="How to Process Purchase Invoice" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-howto-invoice')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-howto-invoice hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-500">
                <svg className="w-16 h-16 mb-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-semibold text-blue-700">Upload Screenshot Here</p>
                <p className="text-sm mt-2 text-blue-600">Show the purchase invoice processing workflow</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseInvoicesGuide;
