"use client";
import React from 'react';
import { Ruler } from 'lucide-react';

const UOMGuide: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg">
            <Ruler className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Unit of Measurement (UOM)</h1>
            <p className="text-gray-600 mt-1">Define and manage measurement units for inventory tracking</p>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Ruler className="w-6 h-6 text-purple-600" />
            What is Unit of Measurement?
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            The Unit of Measurement (UOM) module defines all measurement units used to track 
            inventory quantities in your clinic. Different products require different units - 
            medications might be counted in pieces or boxes, liquids in liters or milliliters, 
            and powders in kilograms or grams. This system ensures accurate stock tracking, 
            enables unit conversions, and prevents confusion when ordering or dispensing supplies.
          </p>

          {/* Dedicated Image Section */}
          <div className="w-full bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-300 p-8 my-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Ruler className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                Unit of Measurement - Complete Interface
              </h3>
            </div>
            <div className="bg-white rounded-xl border-2 border-purple-200 overflow-hidden shadow-inner relative group" style={{ minHeight: '550px', maxHeight: '650px' }}>
              <img 
                src="/uom.png" 
                alt="UOM Management Complete Interface" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-uom')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-uom hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 text-gray-500">
                <Ruler className="w-20 h-20 mb-4 text-purple-400" />
                <p className="text-xl font-semibold text-purple-700">Unit of Measurement Interface</p>
                <p className="text-sm mt-2 text-purple-600">Screenshot will appear here when available</p>
                <div className="mt-4 px-4 py-2 bg-purple-200 rounded-lg text-xs text-purple-800">
                  Expected: /uom.png
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-purple-700">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                This shows the complete UOM configuration and conversion management
              </span>
              <span className="text-xs bg-purple-100 px-3 py-1 rounded-full">Stock Management Module</span>
            </div>
          </div>

          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-purple-900 mb-2">Key Features:</h4>
            <ul className="space-y-2 text-sm text-purple-800">
              <li><strong>Standard Units:</strong> Pre-defined common units (Pieces, Boxes, Bottles, Liters, KG)</li>
              <li><strong>Custom Units:</strong> Create clinic-specific measurement units</li>
              <li><strong>Conversion Factors:</strong> Define relationships between units (1 Box = 50 Pieces)</li>
              <li><strong>Base Unit Definition:</strong> Set primary unit for stock calculations</li>
              <li><strong>Unit Categories:</strong> Group by type (Count, Volume, Weight, Length)</li>
              <li><strong>Abbreviations:</strong> Short codes for quick data entry (PCS, BOX, LTR, KG)</li>
              <li><strong>Decimal Precision:</strong> Specify decimal places for fractional quantities</li>
              <li><strong>Active/Inactive Status:</strong> Enable or disable units as needed</li>
              <li><strong>Multi-level Conversions:</strong> Support complex conversion chains</li>
              <li><strong>Validation Rules:</strong> Prevent invalid unit assignments</li>
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
            UOM Details & Configuration
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Basic Unit Information */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-3">📏 Basic Unit Information</h4>
              <ul className="space-y-2 text-sm text-purple-800">
                <li><strong>Unit Name *:</strong> Full name (e.g., "Piece", "Box", "Liter")</li>
                <li><strong>Abbreviation/Code *:</strong> Short code (e.g., "PCS", "BOX", "LTR")</li>
                <li><strong>Unit Type:</strong> Count, Volume, Weight, Length, Area</li>
                <li><strong>Description:</strong> Detailed explanation of the unit</li>
                <li><strong>Status:</strong> Active or Inactive</li>
              </ul>
            </div>

            {/* Conversion Settings */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">🔄 Conversion Settings</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li><strong>Base Unit:</strong> Primary unit for this category (e.g., Piece for count)</li>
                <li><strong>Conversion Factor:</strong> Multiplier to convert to base unit</li>
                <li><strong>Parent Unit:</strong> Larger unit this converts from (Box → Piece)</li>
                <li><strong>Child Units:</strong> Smaller units this converts to (Liter → Milliliter)</li>
                <li><strong>Rounding Rules:</strong> How to handle fractional conversions</li>
              </ul>
            </div>

            {/* Usage Examples */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-3">💊 Common Medical UOMs</h4>
              <ul className="space-y-2 text-sm text-green-800">
                <li><strong>Pieces (PCS):</strong> Individual items (syringes, gloves, masks)</li>
                <li><strong>Boxes (BOX):</strong> Packaged items (1 box = 50 pieces)</li>
                <li><strong>Bottles (BTL):</strong> Liquid containers (500ml bottles)</li>
                <li><strong>Vials (VIAL):</strong> Small glass containers for injections</li>
                <li><strong>Tubes (TUBE):</strong> Ointments and creams</li>
                <li><strong>Packs (PACK):</strong> Bundled items (pack of 10)</li>
              </ul>
            </div>

            {/* Volume & Weight Units */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-3">⚖️ Volume & Weight Units</h4>
              <ul className="space-y-2 text-sm text-orange-800">
                <li><strong>Liters (LTR):</strong> Large liquid volumes</li>
                <li><strong>Milliliters (ML):</strong> Small liquid volumes (1 LTR = 1000 ML)</li>
                <li><strong>Kilograms (KG):</strong> Heavy items or powders</li>
                <li><strong>Grams (GM):</strong> Light items (1 KG = 1000 GM)</li>
                <li><strong>Pounds (LB):</strong> Imperial weight unit</li>
                <li><strong>Ounces (OZ):</strong> Small imperial weight</li>
              </ul>
            </div>
          </div>

          {/* Conversion Examples Table */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h4 className="font-semibold text-emerald-900 mb-3">🔢 Unit Conversion Examples</h4>
            <div className="bg-white rounded-lg overflow-hidden border border-emerald-200">
              <table className="w-full text-sm">
                <thead className="bg-emerald-100">
                  <tr>
                    <th className="py-3 px-4 text-left text-emerald-900 font-semibold">Product Type</th>
                    <th className="py-3 px-4 text-left text-emerald-900 font-semibold">Larger Unit</th>
                    <th className="py-3 px-4 text-left text-emerald-900 font-semibold">Conversion</th>
                    <th className="py-3 px-4 text-left text-emerald-900 font-semibold">Base Unit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-emerald-100">
                    <td className="py-3 px-4 text-emerald-800">Surgical Gloves</td>
                    <td className="py-3 px-4 text-emerald-800">Box (BOX)</td>
                    <td className="py-3 px-4 text-emerald-800">1 BOX = 100 PCS</td>
                    <td className="py-3 px-4 text-emerald-800">Piece (PCS)</td>
                  </tr>
                  <tr className="border-b border-emerald-100">
                    <td className="py-3 px-4 text-emerald-800">Hand Sanitizer</td>
                    <td className="py-3 px-4 text-emerald-800">Liter (LTR)</td>
                    <td className="py-3 px-4 text-emerald-800">1 LTR = 1000 ML</td>
                    <td className="py-3 px-4 text-emerald-800">Milliliter (ML)</td>
                  </tr>
                  <tr className="border-b border-emerald-100">
                    <td className="py-3 px-4 text-emerald-800">Dental Powder</td>
                    <td className="py-3 px-4 text-emerald-800">Kilogram (KG)</td>
                    <td className="py-3 px-4 text-emerald-800">1 KG = 1000 GM</td>
                    <td className="py-3 px-4 text-emerald-800">Gram (GM)</td>
                  </tr>
                  <tr className="border-b border-emerald-100">
                    <td className="py-3 px-4 text-emerald-800">Bandage Rolls</td>
                    <td className="py-3 px-4 text-emerald-800">Pack (PACK)</td>
                    <td className="py-3 px-4 text-emerald-800">1 PACK = 12 ROLLS</td>
                    <td className="py-3 px-4 text-emerald-800">Roll (ROLL)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-emerald-800">Injection Vials</td>
                    <td className="py-3 px-4 text-emerald-800">Carton (CTN)</td>
                    <td className="py-3 px-4 text-emerald-800">1 CTN = 10 BOX = 500 VIALS</td>
                    <td className="py-3 px-4 text-emerald-800">Vial (VIAL)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Decimal Precision Guide */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h4 className="font-semibold text-indigo-900 mb-3">🔢 Decimal Precision Settings</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-3 border-l-4 border-indigo-500">
                <p className="font-semibold text-indigo-900 mb-2">0 Decimal Places</p>
                <ul className="text-xs text-indigo-700 space-y-1">
                  <li>• Pieces (PCS)</li>
                  <li>• Boxes (BOX)</li>
                  <li>• Bottles (BTL)</li>
                  <li>• Whole items only</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-blue-500">
                <p className="font-semibold text-blue-900 mb-2">2 Decimal Places</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Kilograms (KG)</li>
                  <li>• Liters (LTR)</li>
                  <li>• Meters (M)</li>
                  <li>• Precise measurements</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-purple-500">
                <p className="font-semibold text-purple-900 mb-2">3+ Decimal Places</p>
                <ul className="text-xs text-purple-700 space-y-1">
                  <li>• Grams (GM)</li>
                  <li>• Milliliters (ML)</li>
                  <li>• Laboratory chemicals</li>
                  <li>• High precision needs</li>
                </ul>
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
            How to Configure Units of Measurement
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            Setting up units of measurement correctly is essential for accurate inventory tracking. 
            Follow these steps to define and configure measurement units for your clinic.
          </p>

          <div className="bg-teal-50 border border-teal-200 rounded-lg p-5">
            <h4 className="font-semibold text-teal-900 mb-3">Step-by-Step Guide:</h4>
            <ol className="space-y-4 text-sm text-teal-800">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <strong>Navigate to UOM & Click Add:</strong> Go to Stock Management → Unit of Measurement from the sidebar menu. Click the "Add Unit" or "New UOM" button to open the unit creation form.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <strong>Fill Form & Save:</strong> Enter UOM Name (e.g., "Piece", "Box"), select Category (Count, Volume, Weight), set abbreviation and conversion factor if needed. Once all details are filled, click the "Add UOM" button to save the new unit to the system.
                </div>
              </li>
            </ol>
          </div>

          {/* Image Upload Section - How to Configure Units of Measurement */}
          <div className="w-full bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-dashed border-purple-400 p-8 my-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h4 className="text-xl font-bold text-purple-900">Screenshot: How to Configure Units of Measurement</h4>
            </div>
            <div className="bg-white rounded-xl border-2 border-purple-200 overflow-hidden relative group" style={{ minHeight: '400px', maxHeight: '500px' }}>
              <img 
                src="/uom-add.png" 
                alt="How to Configure UOM Step by Step" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-howto-uom')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-howto-uom hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 text-gray-500">
                <svg className="w-16 h-16 mb-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-semibold text-purple-700">Upload Screenshot Here</p>
                <p className="text-sm mt-2 text-purple-600">Show the UOM configuration interface and workflow</p>
                <div className="mt-4 px-4 py-2 bg-purple-100 rounded-lg text-xs text-purple-800">
                  Expected: /how-to-configure-uom.png
                </div>
              </div>
            </div>
           
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Best Practices for UOM Configuration:</h4>
            <ul className="list-disc list-inside space-y-2 text-sm text-blue-800">
              <li><strong>Use Standard Units:</strong> Stick to internationally recognized units for consistency</li>
              <li><strong>Keep It Simple:</strong> Don't create unnecessary units; use existing ones when possible</li>
              <li><strong>Document Conversions:</strong> Clearly document all conversion factors for reference</li>
              <li><strong>Train Staff:</strong> Ensure all users understand which units to use for different products</li>
              <li><strong>Regular Audits:</strong> Periodically review units and remove unused or duplicate entries</li>
              <li><strong>Consistent Naming:</strong> Use consistent naming conventions (always "Piece" not sometimes "Pcs")</li>
              <li><strong>Validate Data:</strong> Test units with actual products before full deployment</li>
              <li><strong>Consider Future Needs:</strong> Anticipate what units you might need as clinic expands</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> Incorrect unit configuration leads to serious inventory errors. If you define 1 Box = 10 Pieces but it actually contains 50 pieces, your stock counts will be wrong by 400%. Always double-check conversion factors with physical products before finalizing UOM setup.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">Common Mistakes to Avoid:</h4>
            <div className="space-y-3 mt-3">
              <div className="bg-white rounded-lg p-3 border-l-4 border-red-500">
                <p className="font-semibold text-red-900 mb-1">❌ Wrong Conversion Factor</p>
                <p className="text-xs text-red-700">Setting 1 BOX = 10 PCS when box actually contains 100 pieces. Always verify physically.</p>
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-orange-500">
                <p className="font-semibold text-orange-900 mb-1">⚠️ Duplicate Units</p>
                <p className="text-xs text-orange-700">Creating both "PC" and "PCS" for pieces. Use one standard abbreviation consistently.</p>
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-yellow-500">
                <p className="font-semibold text-yellow-900 mb-1">⚡ Missing Base Unit</p>
                <p className="text-xs text-yellow-700">Not defining which unit is the base for calculations. Always set a primary base unit per category.</p>
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-blue-500">
                <p className="font-semibold text-blue-900 mb-1">📊 Inconsistent Decimals</p>
                <p className="text-xs text-blue-700">Allowing 3 decimals for pieces (which should be whole numbers). Match precision to unit type.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UOMGuide;
