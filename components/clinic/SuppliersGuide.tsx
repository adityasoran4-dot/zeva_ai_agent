"use client";
import React from 'react';
import { Building2 } from 'lucide-react';

const SuppliersGuide: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Suppliers - Vendor Management</h1>
            <p className="text-gray-600 mt-1">Manage your clinic's supplier database and vendor relationships</p>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            What is Supplier Management?
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            The Suppliers module maintains a comprehensive database of all vendors and suppliers 
            who provide medical supplies, equipment, pharmaceuticals, and services to your clinic. 
            This system helps you track supplier performance, manage contracts, monitor delivery 
            times, compare pricing, and maintain strong vendor relationships for reliable procurement.
          </p>

          {/* Dedicated Image Section */}
          <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-300 p-8 my-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                Suppliers Management - Complete Interface
              </h3>
            </div>
            <div className="bg-white rounded-xl border-2 border-blue-200 overflow-hidden shadow-inner relative group" style={{ minHeight: '600px', maxHeight: '700px' }}>
              <img 
                src="/supplier.png" 
                alt="Suppliers Management Complete Interface" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-suppliers')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-suppliers hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 text-gray-500">
                <Building2 className="w-20 h-20 mb-4 text-blue-400" />
                <p className="text-xl font-semibold text-blue-700">Suppliers Management Interface</p>
                <p className="text-sm mt-2 text-blue-600">Screenshot will appear here when available</p>
                <div className="mt-4 px-4 py-2 bg-blue-200 rounded-lg text-xs text-blue-800">
                  Expected: /suppliers.png
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-blue-700">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                This shows the complete suppliers database and management dashboard
              </span>
              <span className="text-xs bg-blue-100 px-3 py-1 rounded-full">Stock Management Module</span>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Key Features:</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li><strong>Complete Vendor Database:</strong> Store all supplier contact and business information</li>
              <li><strong>Product Categories:</strong> Track which items each supplier provides</li>
              <li><strong>Payment Terms:</strong> Define credit periods (Net 30, Net 60, COD, Advance)</li>
              <li><strong>Delivery Performance:</strong> Monitor average delivery times and reliability</li>
              <li><strong>Quality Ratings:</strong> Rate suppliers on product quality and service</li>
              <li><strong>Contract Management:</strong> Store contract details, validity periods, and terms</li>
              <li><strong>Pricing History:</strong> Track price changes over time for negotiation</li>
              <li><strong>Communication Log:</strong> Record all interactions with suppliers</li>
              <li><strong>Document Storage:</strong> Attach licenses, certificates, agreements</li>
              <li><strong>Performance Analytics:</strong> Generate reports on supplier reliability and costs</li>
            </ul>
          </div>
        </div>
      </div>

      {/* What You Can See Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Supplier Details & Fields
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Company Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">🏢 Company Information</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li><strong>Company Name *:</strong> Legal business name of the supplier</li>
                <li><strong>Trade License Number:</strong> Official registration/license number</li>
                <li><strong>Tax Registration (TRN):</strong> Tax identification number for invoicing</li>
                <li><strong>Business Type:</strong> Manufacturer, Distributor, Wholesaler, Retailer</li>
                <li><strong>Year Established:</strong> How long they've been in business</li>
                <li><strong>Website:</strong> Company website URL</li>
              </ul>
            </div>

            {/* Contact Details */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-3">📞 Contact Details</h4>
              <ul className="space-y-2 text-sm text-green-800">
                <li><strong>Primary Contact Person:</strong> Main account manager name</li>
                <li><strong>Contact Title:</strong> Their position (Sales Manager, Account Executive)</li>
                <li><strong>Phone Number *:</strong> Direct contact phone</li>
                <li><strong>Mobile Number:</strong> Alternative mobile contact</li>
                <li><strong>Email Address *:</strong> Primary email for orders and communication</li>
                <li><strong>Secondary Email:</strong> Backup email address</li>
              </ul>
            </div>

            {/* Address Information */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-3">📍 Address Information</h4>
              <ul className="space-y-2 text-sm text-purple-800">
                <li><strong>Street Address:</strong> Building name/number and street</li>
                <li><strong>Area/District:</strong> Neighborhood or commercial area</li>
                <li><strong>City/Emirate:</strong> City location (Dubai, Abu Dhabi, etc.)</li>
                <li><strong>Country:</strong> Country of operation</li>
                <li><strong>PO Box:</strong> Postal box number if applicable</li>
                <li><strong>GPS Coordinates:</strong> For delivery navigation</li>
              </ul>
            </div>

            {/* Payment & Terms */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-3">💳 Payment & Terms</h4>
              <ul className="space-y-2 text-sm text-orange-800">
                <li><strong>Payment Terms:</strong> Net 30, Net 60, COD, Advance Payment</li>
                <li><strong>Currency:</strong> AED, USD, EUR, etc.</li>
                <li><strong>Credit Limit:</strong> Maximum outstanding amount allowed</li>
                <li><strong>Bank Details:</strong> Bank name, account number, IBAN for payments</li>
                <li><strong>VAT Percentage:</strong> Applicable VAT rate (5%, 0%, exempt)</li>
              </ul>
            </div>

            {/* Delivery Information */}
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <h4 className="font-semibold text-teal-900 mb-3">🚚 Delivery Information</h4>
              <ul className="space-y-2 text-sm text-teal-800">
                <li><strong>Average Lead Time:</strong> Typical days from order to delivery (e.g., 3-5 days)</li>
                <li><strong>Minimum Order Value:</strong> Minimum purchase amount required</li>
                <li><strong>Delivery Charges:</strong> Fixed fee or free above certain amount</li>
                <li><strong>Delivery Areas:</strong> Geographic areas they serve</li>
                <li><strong>Emergency Delivery:</strong> Same-day or next-day availability</li>
              </ul>
            </div>

            {/* Product Categories */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-3">📦 Product Categories</h4>
              <ul className="space-y-2 text-sm text-red-800">
                <li><strong>Medical Supplies:</strong> Gloves, masks, syringes, gauze</li>
                <li><strong>Pharmaceuticals:</strong> Medications, vaccines, antibiotics</li>
                <li><strong>Dental Equipment:</strong> Chairs, drills, X-ray machines</li>
                <li><strong>Laboratory Supplies:</strong> Reagents, test kits, glassware</li>
                <li><strong>Surgical Instruments:</strong> Scalpels, forceps, sutures</li>
                <li><strong>Office Supplies:</strong> Stationery, printing, furniture</li>
              </ul>
            </div>
          </div>

          {/* Performance Rating System */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h4 className="font-semibold text-emerald-900 mb-3">⭐ Supplier Performance Rating</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-3 border-l-4 border-green-500">
                <p className="font-semibold text-green-900 mb-2">Quality Rating (1-5)</p>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• Product quality consistency</li>
                  <li>• Compliance with specifications</li>
                  <li>• Defect/return rate</li>
                  <li>• Packaging condition</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-blue-500">
                <p className="font-semibold text-blue-900 mb-2">Delivery Rating (1-5)</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• On-time delivery percentage</li>
                  <li>• Average lead time accuracy</li>
                  <li>• Emergency order handling</li>
                  <li>• Delivery condition</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-purple-500">
                <p className="font-semibold text-purple-900 mb-2">Service Rating (1-5)</p>
                <ul className="text-xs text-purple-700 space-y-1">
                  <li>• Responsiveness to inquiries</li>
                  <li>• Problem resolution speed</li>
                  <li>• Professionalism</li>
                  <li>• After-sales support</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Example Suppliers Table */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h4 className="font-semibold text-indigo-900 mb-3">📋 Example Supplier Database</h4>
            <div className="bg-white rounded-lg overflow-hidden border border-indigo-200">
              <table className="w-full text-sm">
                <thead className="bg-indigo-100">
                  <tr>
                    <th className="py-3 px-4 text-left text-indigo-900 font-semibold">Supplier Name</th>
                    <th className="py-3 px-4 text-left text-indigo-900 font-semibold">Category</th>
                    <th className="py-3 px-4 text-left text-indigo-900 font-semibold">Payment Terms</th>
                    <th className="py-3 px-4 text-left text-indigo-900 font-semibold">Lead Time</th>
                    <th className="py-3 px-4 text-left text-indigo-900 font-semibold">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-indigo-100">
                    <td className="py-3 px-4 text-indigo-800">MedSupply UAE LLC</td>
                    <td className="py-3 px-4 text-indigo-800">Medical Consumables</td>
                    <td className="py-3 px-4 text-indigo-800">Net 30</td>
                    <td className="py-3 px-4 text-indigo-800">2-3 days</td>
                    <td className="py-3 px-4"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">⭐ 4.8/5</span></td>
                  </tr>
                  <tr className="border-b border-indigo-100">
                    <td className="py-3 px-4 text-indigo-800">PharmaCare Distribution</td>
                    <td className="py-3 px-4 text-indigo-800">Pharmaceuticals</td>
                    <td className="py-3 px-4 text-indigo-800">Net 60</td>
                    <td className="py-3 px-4 text-indigo-800">3-5 days</td>
                    <td className="py-3 px-4"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">⭐ 4.5/5</span></td>
                  </tr>
                  <tr className="border-b border-indigo-100">
                    <td className="py-3 px-4 text-indigo-800">DentalTech Solutions</td>
                    <td className="py-3 px-4 text-indigo-800">Dental Equipment</td>
                    <td className="py-3 px-4 text-indigo-800">50% Advance</td>
                    <td className="py-3 px-4 text-indigo-800">7-10 days</td>
                    <td className="py-3 px-4"><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">⭐ 4.2/5</span></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-indigo-800">LabChem International</td>
                    <td className="py-3 px-4 text-indigo-800">Laboratory Supplies</td>
                    <td className="py-3 px-4 text-indigo-800">Net 30</td>
                    <td className="py-3 px-4 text-indigo-800">5-7 days</td>
                    <td className="py-3 px-4"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">⭐ 4.6/5</span></td>
                  </tr>
                </tbody>
              </table>
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
            How to Manage Suppliers
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            Adding and managing suppliers ensures you have reliable sources for all your clinic's 
            procurement needs. Follow these steps to build and maintain your supplier database.
          </p>

          <div className="bg-teal-50 border border-teal-200 rounded-lg p-5">
            <h4 className="font-semibold text-teal-900 mb-3">Step-by-Step Guide:</h4>
            <ol className="space-y-4 text-sm text-teal-800">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <strong>Navigate to Suppliers:</strong> Go to Stock Management → Suppliers from the sidebar menu. View existing supplier list with ratings and status.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <strong>Add New Supplier:</strong> Click "Add Supplier" or "New Supplier" button. A comprehensive form opens for entering supplier details.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <div>
                  <strong>Enter Company Details:</strong> Fill in company legal name, trade license number, tax registration (TRN), business type, and year established. These are essential for legal compliance.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <div>
                  <strong>Add Contact Information:</strong> Enter primary contact person's name, title, phone numbers, and email addresses. Add secondary contacts for backup communication.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                <div>
                  <strong>Input Address:</strong> Provide complete business address including street, area, city/emirate, country, and PO Box. Add GPS coordinates for delivery purposes.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">6</span>
                <div>
                  <strong>Set Payment Terms:</strong> Define payment conditions (Net 30, Net 60, COD, Advance). Enter currency, credit limit, bank details for payments, and VAT percentage.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">7</span>
                <div>
                  <strong>Configure Delivery Details:</strong> Specify average lead time (e.g., 3-5 days), minimum order value, delivery charges, service areas, and emergency delivery options.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">8</span>
                <div>
                  <strong>Select Product Categories:</strong> Check all categories this supplier provides (Medical Supplies, Pharmaceuticals, Dental Equipment, Lab Supplies, etc.).
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">9</span>
                <div>
                  <strong>Upload Documents:</strong> Attach trade license copy, tax certificate, product catalogs, price lists, and any signed agreements or contracts.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">10</span>
                <div>
                  <strong>Save Supplier:</strong> Review all information for accuracy. Click "Save" to add supplier to database. Start rating their performance after first few orders.
                </div>
              </li>
            </ol>
          </div>

          {/* Image Upload Section - How to Manage Suppliers */}
          <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-dashed border-blue-400 p-8 my-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h4 className="text-xl font-bold text-blue-900">Screenshot: How to Manage Suppliers</h4>
            </div>
            <div className="bg-white rounded-xl border-2 border-blue-200 overflow-hidden relative group" style={{ minHeight: '500px', maxHeight: '600px' }}>
              <img 
                src="/supplier-add.png" 
                alt="How to Manage Suppliers Step by Step" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-howto-suppliers')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-howto-suppliers hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-500">
                <svg className="w-16 h-16 mb-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-semibold text-blue-700">Upload Screenshot Here</p>
                <p className="text-sm mt-2 text-blue-600">Show the suppliers management interface and workflow</p>
                <div className="mt-4 px-4 py-2 bg-blue-100 rounded-lg text-xs text-blue-800">
                  Expected: /how-to-manage-suppliers.png
                </div>
              </div>
            </div>
            
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Best Practices for Supplier Management:</h4>
            <ul className="list-disc list-inside space-y-2 text-sm text-blue-800">
              <li><strong>Diversify Suppliers:</strong> Don't rely on single supplier for critical items; maintain 2-3 alternatives</li>
              <li><strong>Regular Reviews:</strong> Evaluate supplier performance quarterly using rating system</li>
              <li><strong>Negotiate Contracts:</strong> Lock in prices and terms with annual contracts for better rates</li>
              <li><strong>Track Performance:</strong> Monitor delivery times, quality issues, and responsiveness consistently</li>
              <li><strong>Build Relationships:</strong> Maintain good communication for better service and priority during shortages</li>
              <li><strong>Verify Credentials:</strong> Regularly check that licenses and certifications are current</li>
              <li><strong>Compare Pricing:</strong> Get quotes from multiple suppliers before large purchases</li>
              <li><strong>Document Everything:</strong> Keep records of all communications, agreements, and issues</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> Your suppliers are critical partners in maintaining uninterrupted clinic operations. Always verify supplier credentials, maintain updated contact information, and regularly assess their performance. Poor supplier selection can lead to stockouts, delayed treatments, and compromised patient care.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">Supplier Evaluation Checklist:</h4>
            <div className="grid md:grid-cols-2 gap-4 mt-3">
              <div className="bg-white rounded-lg p-3 border-l-4 border-green-500">
                <p className="font-semibold text-green-900 mb-2">✅ Before Onboarding</p>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• Verify trade license validity</li>
                  <li>• Check tax registration status</li>
                  <li>• Request product certifications</li>
                  <li>• Obtain references from other clinics</li>
                  <li>• Compare pricing with market rates</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-blue-500">
                <p className="font-semibold text-blue-900 mb-2">📊 Ongoing Monitoring</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Track on-time delivery rate</li>
                  <li>• Monitor product quality consistency</li>
                  <li>• Review response time to queries</li>
                  <li>• Assess problem resolution efficiency</li>
                  <li>• Evaluate pricing competitiveness</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuppliersGuide;
