"use client";
import React from 'react';
import { ShoppingCart } from 'lucide-react';

const PurchaseOrdersGuide: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-teal-500 to-green-600 rounded-xl shadow-lg">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase Orders - Supplier Orders</h1>
            <p className="text-gray-600 mt-1">Create and manage formal purchase orders to suppliers</p>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-teal-50 to-green-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-teal-600" />
            What are Purchase Orders?
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            Purchase Orders (PO) are formal legal documents sent to suppliers requesting specific 
            goods or services at agreed-upon prices and terms. Once a Purchase Request is approved 
            internally, the procurement team creates a Purchase Order and sends it to the selected 
            supplier. The PO becomes a binding contract when the supplier accepts it, outlining 
            exactly what will be delivered, when, where, and at what cost.
          </p>

          {/* Dedicated Image Section */}
          <div className="w-full bg-gradient-to-br from-teal-50 to-green-50 rounded-2xl border-2 border-teal-300 p-8 my-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-teal-600 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                Purchase Orders - Complete Interface
              </h3>
            </div>
            <div className="bg-white rounded-xl border-2 border-teal-200 overflow-hidden shadow-inner relative group" style={{ minHeight: '550px', maxHeight: '650px' }}>
              <img 
                src="/order.png" 
                alt="Purchase Orders Complete Interface" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-po')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-po hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-teal-100 to-green-100 text-gray-500">
                <ShoppingCart className="w-20 h-20 mb-4 text-teal-400" />
                <p className="text-xl font-semibold text-teal-700">Purchase Orders Interface</p>
                <p className="text-sm mt-2 text-teal-600">Screenshot will appear here when available</p>
                <div className="mt-4 px-4 py-2 bg-teal-200 rounded-lg text-xs text-teal-800">
                  Expected: /purchase-orders.png
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-teal-700">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                This shows the complete purchase order creation and supplier management
              </span>
              <span className="text-xs bg-teal-100 px-3 py-1 rounded-full">Stock Management Module</span>
            </div>
          </div>

          <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-teal-900 mb-2">Key Features:</h4>
            <ul className="space-y-2 text-sm text-teal-800">
              <li><strong>Formal Legal Document:</strong> Binding contract between clinic and supplier</li>
              <li><strong>Sequential PO Numbers:</strong> Unique auto-generated numbering (PO-2024-001)</li>
              <li><strong>Supplier Selection:</strong> Choose from approved vendor database</li>
              <li><strong>Detailed Line Items:</strong> Product, quantity, unit price, total amount per item</li>
              <li><strong>Delivery Scheduling:</strong> Specify delivery date, time, and location</li>
              <li><strong>Payment Terms:</strong> Net 30, Net 60, COD, Advance payment conditions</li>
              <li><strong>Tax Calculations:</strong> Automatic VAT computation (5%, 0%, exempt)</li>
              <li><strong>Status Tracking:</strong> Draft, Sent, Confirmed, Partially Received, Completed, Cancelled</li>
              <li><strong>Document Attachment:</strong> Attach quotes, specifications, contracts</li>
              <li><strong>Email Integration:</strong> Send POs directly to suppliers via email</li>
              <li><strong>Receiving & GRN:</strong> Track deliveries and generate Goods Received Notes</li>
              <li><strong>Three-Way Matching:</strong> Match PO, GRN, and Invoice before payment</li>
            </ul>
          </div>
        </div>
      </div>

      {/* What You Can See Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Purchase Order Details & Fields
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* PO Header Information */}
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <h4 className="font-semibold text-teal-900 mb-3">📋 PO Header Information</h4>
              <ul className="space-y-2 text-sm text-teal-800">
                <li><strong>PO Number *:</strong> Auto-generated unique identifier (PO-2024-001)</li>
                <li><strong>PO Date *:</strong> Date order is created</li>
                <li><strong>Related PR Number:</strong> Linked Purchase Request reference</li>
                <li><strong>Supplier *:</strong> Selected vendor from database</li>
                <li><strong>Supplier Contact:</strong> Sales representative name and details</li>
                <li><strong>Currency:</strong> AED, USD, EUR, etc.</li>
              </ul>
            </div>

            {/* Delivery Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">🚚 Delivery Information</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li><strong>Delivery Date *:</strong> Expected delivery date from supplier</li>
                <li><strong>Delivery Location *:</strong> Which warehouse/location to deliver to</li>
                <li><strong>Delivery Address:</strong> Complete address for shipment</li>
                <li><strong>Contact Person:</strong> Who will receive the delivery</li>
                <li><strong>Contact Phone:</strong> Phone number for delivery coordination</li>
                <li><strong>Special Instructions:</strong> Handling requirements, access codes, etc.</li>
              </ul>
            </div>

            {/* Payment Terms */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-3">💳 Payment Terms</h4>
              <ul className="space-y-2 text-sm text-purple-800">
                <li><strong>Payment Method:</strong> Bank Transfer, Check, Cash, Credit Card</li>
                <li><strong>Payment Terms:</strong> Net 30, Net 60, COD, 50% Advance</li>
                <li><strong>Due Date:</strong> When payment must be made</li>
                <li><strong>Bank Details:</strong> Supplier's bank account for transfers</li>
                <li><strong>VAT Percentage:</strong> Applicable tax rate (5%, 0%, Exempt)</li>
                <li><strong>VAT Amount:</strong> Automatically calculated tax</li>
              </ul>
            </div>

            {/* Order Items */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-3">📦 Order Line Items</h4>
              <ul className="space-y-2 text-sm text-orange-800">
                <li><strong>Item Code:</strong> Product SKU or catalog number</li>
                <li><strong>Product Name *:</strong> Description of item ordered</li>
                <li><strong>Quantity *:</strong> Number of units ordered</li>
                <li><strong>Unit of Measurement *:</strong> PCS, BOX, LTR, KG</li>
                <li><strong>Unit Price *:</strong> Cost per unit (negotiated with supplier)</li>
                <li><strong>Line Total:</strong> Quantity × Unit Price</li>
                <li><strong>Discount %:</strong> Any negotiated discount</li>
                <li><strong>Tax Rate:</strong> Item-specific tax if different from header</li>
              </ul>
            </div>
          </div>

          {/* PO Status Flow */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h4 className="font-semibold text-emerald-900 mb-3">📊 Purchase Order Status Flow</h4>
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white rounded-lg p-3 border-l-4 border-gray-400">
                <p className="font-semibold text-gray-900 mb-1 text-xs">Draft</p>
                <p className="text-xs text-gray-600">Created but not sent</p>
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-blue-500">
                <p className="font-semibold text-blue-900 mb-1 text-xs">Sent</p>
                <p className="text-xs text-blue-600">Emailed to supplier</p>
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-yellow-500">
                <p className="font-semibold text-yellow-900 mb-1 text-xs">Confirmed</p>
                <p className="text-xs text-yellow-600">Supplier accepted</p>
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-orange-500">
                <p className="font-semibold text-orange-900 mb-1 text-xs">Partially Received</p>
                <p className="text-xs text-orange-600">Some items delivered</p>
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-green-500">
                <p className="font-semibold text-green-900 mb-1 text-xs">Completed</p>
                <p className="text-xs text-green-600">All items received</p>
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-red-500">
                <p className="font-semibold text-red-900 mb-1 text-xs">Cancelled</p>
                <p className="text-xs text-red-600">Order cancelled</p>
              </div>
            </div>
          </div>

          {/* Example Purchase Order */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h4 className="font-semibold text-indigo-900 mb-3">📄 Example Purchase Order</h4>
            <div className="bg-white rounded-lg p-4 border border-indigo-200">
              <div className="mb-4 pb-3 border-b border-indigo-100">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-indigo-900 mb-1">PO Number: <span className="font-normal text-indigo-800">PO-2024-078</span></p>
                    <p className="font-semibold text-indigo-900 mb-1">PO Date: <span className="font-normal text-indigo-800">10-Apr-2024</span></p>
                    <p className="font-semibold text-indigo-900 mb-1">Related PR: <span className="font-normal text-indigo-800">PR-2024-045</span></p>
                  </div>
                  <div>
                    <p className="font-semibold text-indigo-900 mb-1">Supplier: <span className="font-normal text-indigo-800">MedSupply UAE LLC</span></p>
                    <p className="font-semibold text-indigo-900 mb-1">Contact: <span className="font-normal text-indigo-800">Ahmed Hassan (Sales Manager)</span></p>
                    <p className="font-semibold text-indigo-900 mb-1">Payment Terms: <span className="font-normal text-indigo-800">Net 30 Days</span></p>
                  </div>
                </div>
              </div>
              
              <table className="w-full text-sm mb-4">
                <thead className="bg-indigo-50">
                  <tr>
                    <th className="py-2 px-3 text-left text-indigo-900 font-semibold">#</th>
                    <th className="py-2 px-3 text-left text-indigo-900 font-semibold">Product</th>
                    <th className="py-2 px-3 text-center text-indigo-900 font-semibold">Qty</th>
                    <th className="py-2 px-3 text-center text-indigo-900 font-semibold">UOM</th>
                    <th className="py-2 px-3 text-right text-indigo-900 font-semibold">Unit Price</th>
                    <th className="py-2 px-3 text-right text-indigo-900 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-indigo-50">
                    <td className="py-2 px-3 text-indigo-800">1</td>
                    <td className="py-2 px-3 text-indigo-800">Surgical Gloves (Latex-Free)</td>
                    <td className="py-2 px-3 text-center text-indigo-800">20</td>
                    <td className="py-2 px-3 text-center text-indigo-800">BOX</td>
                    <td className="py-2 px-3 text-right text-indigo-800">50.00 AED</td>
                    <td className="py-2 px-3 text-right text-indigo-800 font-semibold">1,000.00 AED</td>
                  </tr>
                  <tr className="border-b border-indigo-50">
                    <td className="py-2 px-3 text-indigo-800">2</td>
                    <td className="py-2 px-3 text-indigo-800">Face Masks (3-Ply)</td>
                    <td className="py-2 px-3 text-center text-indigo-800">15</td>
                    <td className="py-2 px-3 text-center text-indigo-800">BOX</td>
                    <td className="py-2 px-3 text-right text-indigo-800">30.00 AED</td>
                    <td className="py-2 px-3 text-right text-indigo-800 font-semibold">450.00 AED</td>
                  </tr>
                  <tr className="border-b border-indigo-50">
                    <td className="py-2 px-3 text-indigo-800">3</td>
                    <td className="py-2 px-3 text-indigo-800">Local Anesthetic Solution</td>
                    <td className="py-2 px-3 text-center text-indigo-800">50</td>
                    <td className="py-2 px-3 text-center text-indigo-800">VIAL</td>
                    <td className="py-2 px-3 text-right text-indigo-800">15.00 AED</td>
                    <td className="py-2 px-3 text-right text-indigo-800 font-semibold">750.00 AED</td>
                  </tr>
                </tbody>
              </table>
              
              <div className="border-t-2 border-indigo-200 pt-3">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-indigo-900 mb-1">Delivery Date: <span className="font-normal text-indigo-800">15-Apr-2024</span></p>
                    <p className="font-semibold text-indigo-900 mb-1">Delivery Location: <span className="font-normal text-indigo-800">Main Central Store</span></p>
                    <p className="font-semibold text-indigo-900">Special Instructions: <span className="font-normal text-indigo-800">Deliver before 2 PM. Call upon arrival.</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-indigo-800 mb-1">Subtotal: <span className="font-semibold">2,200.00 AED</span></p>
                    <p className="text-indigo-800 mb-1">VAT (5%): <span className="font-semibold">110.00 AED</span></p>
                    <p className="text-indigo-900 text-lg font-bold">Grand Total: 2,310.00 AED</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How to Use Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            How to Create Purchase Orders
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            Creating purchase orders from approved requests is a critical procurement task. 
            Follow these steps to generate accurate POs and maintain strong supplier relationships.
          </p>

          <div className="bg-teal-50 border border-teal-200 rounded-lg p-5">
            <h4 className="font-semibold text-teal-900 mb-3">Step-by-Step Guide:</h4>
            <ol className="space-y-4 text-sm text-teal-800">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <strong>Navigate to Purchase Orders:</strong> Go to Stock Management → Purchase Orders from sidebar. View all POs with status filters and search options.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <strong>Convert from Approved PR:</strong> Find approved Purchase Request in list. Click "Convert to PO" button. System auto-populates PO with PR details including items, quantities, and required date.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <div>
                  <strong>Select Supplier:</strong> Choose supplier from dropdown. System shows supplier details, payment terms, and average lead time. For new suppliers, ensure they're added to vendor database first.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <div>
                  <strong>Review Line Items:</strong> Verify all products, quantities, and UOM are correct. Update unit prices based on latest quotations or contracts. System calculates line totals automatically.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                <div>
                  <strong>Set Delivery Details:</strong> Confirm delivery date with supplier if needed. Select delivery location (which warehouse). Add contact person who will receive goods. Include special instructions (access codes, unloading requirements).
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">6</span>
                <div>
                  <strong>Configure Payment Terms:</strong> Select payment method (Bank Transfer, Check, etc.). Confirm payment terms (Net 30, Net 60, COD). System calculates VAT automatically based on supplier's tax registration.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">7</span>
                <div>
                  <strong>Add Attachments:</strong> Upload supplier quotation, product specifications, signed contracts, or any supporting documents. These become part of the official PO record.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">8</span>
                <div>
                  <strong>Save as Draft or Send:</strong> Review entire PO for accuracy. Save as Draft if you need internal review first. Click "Send to Supplier" to finalize and email PO directly to supplier's registered email address.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">9</span>
                <div>
                  <strong>Track Confirmation:</strong> Monitor PO status. Supplier should confirm acceptance within 24-48 hours. If no response, follow up with phone call. Update status to "Confirmed" once supplier accepts.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">10</span>
                <div>
                  <strong>Receive Goods & Close PO:</strong> When delivery arrives, verify items against PO. Create Goods Received Note (GRN) in system. Mark items as received. Update status to "Partially Received" or "Completed". Process supplier invoice for payment using three-way matching (PO + GRN + Invoice).
                </div>
              </li>
            </ol>
          </div>

          {/* Image Upload Section - How to Create Purchase Orders */}
          <div className="w-full bg-gradient-to-br from-teal-50 to-green-50 rounded-2xl border-2 border-dashed border-teal-400 p-8 my-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h4 className="text-xl font-bold text-teal-900">Screenshot: How to Create Purchase Orders</h4>
            </div>
            <div className="bg-white rounded-xl border-2 border-teal-200 overflow-hidden relative group" style={{ minHeight: '500px', maxHeight: '600px' }}>
              <img 
                src="/order1.png" 
                alt="How to Create Purchase Orders Step by Step" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-howto-po')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-howto-po hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-green-50 text-gray-500">
                <svg className="w-16 h-16 mb-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-semibold text-teal-700">Upload Screenshot Here</p>
                <p className="text-sm mt-2 text-teal-600">Show the purchase order creation and supplier management workflow</p>
                <div className="mt-4 px-4 py-2 bg-teal-100 rounded-lg text-xs text-teal-800">
                  Expected: /how-to-create-purchase-orders.png
                </div>
              </div>
            </div>
           
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Best Practices for Purchase Orders:</h4>
            <ul className="list-disc list-inside space-y-2 text-sm text-blue-800">
              <li><strong>Accurate Pricing:</strong> Always use latest negotiated prices from contracts or quotations</li>
              <li><strong>Clear Specifications:</strong> Include detailed product specs to avoid receiving wrong items</li>
              <li><strong>Realistic Delivery Dates:</strong> Confirm dates with supplier before setting in PO</li>
              <li><strong>Complete Documentation:</strong> Attach all relevant documents for reference and audit</li>
              <li><strong>Follow Up Promptly:</strong> Contact suppliers who don't confirm POs within 48 hours</li>
              <li><strong>Track Partial Deliveries:</strong> Update PO status accurately as items arrive</li>
              <li><strong>Three-Way Matching:</strong> Always match PO, GRN, and Invoice before approving payment</li>
              <li><strong>Maintain PO Log:</strong> Keep organized records of all POs for financial audits</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> Purchase Orders are legally binding contracts. Once sent and confirmed by the supplier, you're committed to purchasing the items at the specified price. Always double-check quantities, prices, and delivery terms before sending. Errors can result in financial losses or disputes with suppliers.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">Goods Receiving Process:</h4>
            <div className="space-y-3 mt-3">
              <div className="bg-white rounded-lg p-3 border-l-4 border-green-500">
                <p className="font-semibold text-green-900 mb-1">Step 1: Physical Inspection</p>
                <ul className="list-disc list-inside ml-5 space-y-1 text-xs text-green-700">
                  <li>Verify delivery matches PO number</li>
                  <li>Check packaging condition for damage</li>
                  <li>Count quantities received</li>
                  <li>Inspect product quality and expiry dates</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg p-3 border-l-4 border-blue-500">
                <p className="font-semibold text-blue-900 mb-1">Step 2: Create GRN (Goods Received Note)</p>
                <ul className="list-disc list-inside ml-5 space-y-1 text-xs text-blue-700">
                  <li>Enter received quantities in system</li>
                  <li>Note any discrepancies or damaged items</li>
                  <li>Record batch numbers and expiry dates</li>
                  <li>Assign storage location for received items</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg p-3 border-l-4 border-purple-500">
                <p className="font-semibold text-purple-900 mb-1">Step 3: Update Inventory</p>
                <ul className="list-disc list-inside ml-5 space-y-1 text-xs text-purple-700">
                  <li>System automatically increases stock levels</li>
                  <li>Update PO status to "Partially Received" or "Completed"</li>
                  <li>Generate stock valuation reports</li>
                  <li>Notify requesting department that items arrived</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg p-3 border-l-4 border-orange-500">
                <p className="font-semibold text-orange-900 mb-1">Step 4: Invoice Processing</p>
                <ul className="list-disc list-inside ml-5 space-y-1 text-xs text-orange-700">
                  <li>Receive supplier invoice</li>
                  <li>Perform three-way matching (PO vs GRN vs Invoice)</li>
                  <li>Verify pricing and quantities match</li>
                  <li>Forward to finance for payment processing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrdersGuide;
