"use client";
import React from 'react';
import { MapPin } from 'lucide-react';

const LocationsGuide: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Locations - Storage Management</h1>
            <p className="text-gray-600 mt-1">Manage all storage areas and warehouse locations in your clinic</p>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-green-600" />
            What is Location Management?
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            The Locations module allows you to define and manage all physical storage areas where 
            inventory is kept in your clinic. This includes main warehouses, department-specific 
            stores, pharmacy sections, lab storage, and branch locations. Proper location management 
            helps you track exactly where each item is stored, assign responsibility to staff members, 
            and optimize stock distribution across multiple areas.
          </p>

          {/* Dedicated Image Section */}
          <div className="w-full bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-300 p-8 my-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-600 rounded-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                Locations Management - Complete Interface
              </h3>
            </div>
            <div className="bg-white rounded-xl border-2 border-green-200 overflow-hidden shadow-inner relative group" style={{ minHeight: '550px', maxHeight: '650px' }}>
              <img 
                src="/location.png" 
                alt="Locations Management Complete Interface" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-locations')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-locations hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-green-100 to-emerald-100 text-gray-500">
                <MapPin className="w-20 h-20 mb-4 text-green-400" />
                <p className="text-xl font-semibold text-green-700">Locations Management Interface</p>
                <p className="text-sm mt-2 text-green-600">Screenshot will appear here when available</p>
                <div className="mt-4 px-4 py-2 bg-green-200 rounded-lg text-xs text-green-800">
                  Expected: /locations.png
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-green-700">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                This shows the complete locations management dashboard
              </span>
              <span className="text-xs bg-green-100 px-3 py-1 rounded-full">Stock Management Module</span>
            </div>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-green-900 mb-2">Key Features:</h4>
            <ul className="space-y-2 text-sm text-green-800">
              <li><strong>Multiple Storage Areas:</strong> Define unlimited locations (Main Store, Pharmacy, Dental Store, Lab, etc.)</li>
              <li><strong>Branch Warehouses:</strong> Manage inventory across different clinic branches</li>
              <li><strong>Location Codes:</strong> Assign unique codes for easy identification (LOC-001, LOC-002)</li>
              <li><strong>Capacity Management:</strong> Set maximum storage capacity per location</li>
              <li><strong>Location Managers:</strong> Assign responsible staff to each storage area</li>
              <li><strong>Room/Section Organization:</strong> Organize within locations (Shelf A, Cabinet B, Rack 3)</li>
              <li><strong>Status Tracking:</strong> Activate/deactivate locations as needed</li>
              <li><strong>GPS Coordinates:</strong> Add map coordinates for external warehouses</li>
              <li><strong>Contact Information:</strong> Store manager contact details for each location</li>
              <li><strong>Operating Hours:</strong> Define when each location is accessible</li>
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
            Location Details & Fields
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-3">📋 Basic Information</h4>
              <ul className="space-y-2 text-sm text-green-800">
                <li><strong>Location Name *:</strong> Descriptive name (e.g., "Main Warehouse", "Pharmacy Store")</li>
                <li><strong>Location Code *:</strong> Unique identifier (e.g., "MAIN-001", "PHARM-002")</li>
                <li><strong>Location Type:</strong> Main Store, Department Store, Branch Warehouse, External</li>
                <li><strong>Description:</strong> Detailed description of the location's purpose</li>
                <li><strong>Status:</strong> Active or Inactive</li>
              </ul>
            </div>

            {/* Address & Contact */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">📞 Address & Contact</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li><strong>Address Line 1:</strong> Street address or building name</li>
                <li><strong>Address Line 2:</strong> Floor, unit number, or additional details</li>
                <li><strong>City/Emirate:</strong> City location (Dubai, Abu Dhabi, etc.)</li>
                <li><strong>Phone Number:</strong> Location contact phone</li>
                <li><strong>Email:</strong> Location-specific email address</li>
                <li><strong>GPS Coordinates:</strong> Latitude and longitude for mapping</li>
              </ul>
            </div>

            {/* Capacity & Management */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-3">👥 Capacity & Management</h4>
              <ul className="space-y-2 text-sm text-purple-800">
                <li><strong>Maximum Capacity:</strong> Total storage capacity (in cubic meters or units)</li>
                <li><strong>Current Utilization:</strong> Percentage of capacity currently used</li>
                <li><strong>Location Manager:</strong> Staff member responsible for this location</li>
                <li><strong>Assistant Manager:</strong> Backup person in charge</li>
                <li><strong>Authorized Personnel:</strong> List of staff allowed to access</li>
              </ul>
            </div>

            {/* Organization Structure */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-3">🗂️ Organization Structure</h4>
              <ul className="space-y-2 text-sm text-orange-800">
                <li><strong>Zones/Areas:</strong> Divide location into zones (Zone A, Zone B)</li>
                <li><strong>Racks/Shelves:</strong> Number racks and shelves for precise tracking</li>
                <li><strong>Bins/Containers:</strong> Individual storage containers with labels</li>
                <li><strong>Temperature Zones:</strong> Cold storage, room temperature, controlled areas</li>
                <li><strong>Hazardous Materials Area:</strong> Separate section for dangerous goods</li>
              </ul>
            </div>
          </div>

          {/* Example Locations Table */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h4 className="font-semibold text-emerald-900 mb-3">📍 Example Location Setup</h4>
            <div className="bg-white rounded-lg overflow-hidden border border-emerald-200">
              <table className="w-full text-sm">
                <thead className="bg-emerald-100">
                  <tr>
                    <th className="py-3 px-4 text-left text-emerald-900 font-semibold">Location Name</th>
                    <th className="py-3 px-4 text-left text-emerald-900 font-semibold">Code</th>
                    <th className="py-3 px-4 text-left text-emerald-900 font-semibold">Type</th>
                    <th className="py-3 px-4 text-left text-emerald-900 font-semibold">Manager</th>
                    <th className="py-3 px-4 text-left text-emerald-900 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-emerald-100">
                    <td className="py-3 px-4 text-emerald-800">Main Central Store</td>
                    <td className="py-3 px-4 text-emerald-800">MAIN-001</td>
                    <td className="py-3 px-4 text-emerald-800">Main Store</td>
                    <td className="py-3 px-4 text-emerald-800">Ahmed Hassan</td>
                    <td className="py-3 px-4"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span></td>
                  </tr>
                  <tr className="border-b border-emerald-100">
                    <td className="py-3 px-4 text-emerald-800">Pharmacy Storage</td>
                    <td className="py-3 px-4 text-emerald-800">PHARM-001</td>
                    <td className="py-3 px-4 text-emerald-800">Department Store</td>
                    <td className="py-3 px-4 text-emerald-800">Dr. Sarah Khan</td>
                    <td className="py-3 px-4"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span></td>
                  </tr>
                  <tr className="border-b border-emerald-100">
                    <td className="py-3 px-4 text-emerald-800">Dental Supplies Room</td>
                    <td className="py-3 px-4 text-emerald-800">DENT-001</td>
                    <td className="py-3 px-4 text-emerald-800">Department Store</td>
                    <td className="py-3 px-4 text-emerald-800">Dr. Mohammed Ali</td>
                    <td className="py-3 px-4"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span></td>
                  </tr>
                  <tr className="border-b border-emerald-100">
                    <td className="py-3 px-4 text-emerald-800">Laboratory Store</td>
                    <td className="py-3 px-4 text-emerald-800">LAB-001</td>
                    <td className="py-3 px-4 text-emerald-800">Department Store</td>
                    <td className="py-3 px-4 text-emerald-800">Fatima Al Mansoori</td>
                    <td className="py-3 px-4"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-emerald-800">Jumeirah Branch Warehouse</td>
                    <td className="py-3 px-4 text-emerald-800">BR-JUM-001</td>
                    <td className="py-3 px-4 text-emerald-800">Branch Warehouse</td>
                    <td className="py-3 px-4 text-emerald-800">Omar Abdullah</td>
                    <td className="py-3 px-4"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span></td>
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
            How to Manage Locations
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            Setting up and managing locations is straightforward. Follow these steps to create 
            and configure storage areas for your clinic's inventory management system.
          </p>

          <div className="bg-teal-50 border border-teal-200 rounded-lg p-5">
            <h4 className="font-semibold text-teal-900 mb-3">Step-by-Step Guide:</h4>
            <ol className="space-y-4 text-sm text-teal-800">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <strong>Navigate to Locations & Click Add:</strong> Go to Stock Management → Locations from the sidebar menu. Click the "Add New Location" or "Create Location" button at the top right corner of the page.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <strong>Fill Location Details & Save:</strong> Enter Location Name, Location Code, select Location Type, add address, set capacity, assign manager, and fill other required details. Once all information is entered, click the "Add Location" button to save the new location to the system.
                </div>
              </li>
            </ol>
          </div>

          {/* Image Upload Section - How to Manage Locations */}
          <div className="w-full bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-dashed border-green-400 p-8 my-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h4 className="text-xl font-bold text-green-900">Screenshot: How to Manage Locations</h4>
            </div>
            <div className="bg-white rounded-xl border-2 border-green-200 overflow-hidden relative group" style={{ minHeight: '400px', maxHeight: '500px' }}>
              <img 
                src="/location-new.png" 
                alt="How to Manage Locations Step by Step" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-howto-locations')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-howto-locations hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 text-gray-500">
                <svg className="w-16 h-16 mb-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-semibold text-green-700">Upload Screenshot Here</p>
                <p className="text-sm mt-2 text-green-600">Show the locations management interface and workflow</p>
                <div className="mt-4 px-4 py-2 bg-green-100 rounded-lg text-xs text-green-800">
                  Expected: /how-to-manage-locations.png
                </div>
              </div>
            </div>
            
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Best Practices for Location Management:</h4>
            <ul className="list-disc list-inside space-y-2 text-sm text-blue-800">
              <li><strong>Logical Naming:</strong> Use clear, descriptive names that indicate purpose (e.g., "Cold Storage - Vaccines" not just "Store 1")</li>
              <li><strong>Consistent Coding:</strong> Follow a standard code format (TYPE-XXX) for easy identification and sorting</li>
              <li><strong>Regular Audits:</strong> Verify physical stock matches system records monthly for each location</li>
              <li><strong>Access Control:</strong> Restrict location access to authorized personnel only</li>
              <li><strong>Temperature Monitoring:</strong> For cold storage, install temperature sensors and alerts</li>
              <li><strong>Safety Compliance:</strong> Ensure hazardous materials are stored in approved, labeled areas</li>
              <li><strong>Clear Signage:</strong> Label all locations, zones, racks, and shelves visibly</li>
              <li><strong>Optimize Layout:</strong> Place frequently used items near entrance for easy access</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> Accurate location data is critical for efficient stock retrieval and inventory audits. Always update location information immediately when changes occur (manager transfers, capacity changes, closures). Incorrect location assignments can lead to lost inventory and delayed patient care.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">Common Location Types:</h4>
            <div className="grid md:grid-cols-2 gap-4 mt-3">
              <div className="bg-white rounded-lg p-3 border-l-4 border-green-500">
                <p className="font-semibold text-green-900 mb-2">🏢 Main Central Store</p>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• Primary warehouse for bulk storage</li>
                  <li>• Receives all incoming shipments</li>
                  <li>• Distributes to departments</li>
                  <li>• Managed by senior storekeeper</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-blue-500">
                <p className="font-semibold text-blue-900 mb-2">💊 Pharmacy Store</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Medications and pharmaceuticals</li>
                  <li>• Temperature-controlled environment</li>
                  <li>• Controlled substances secure area</li>
                  <li>• Managed by licensed pharmacist</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-purple-500">
                <p className="font-semibold text-purple-900 mb-2">🦷 Department Stores</p>
                <ul className="text-xs text-purple-700 space-y-1">
                  <li>• Dental, ENT, Orthopedic supplies</li>
                  <li>• Specialty equipment and consumables</li>
                  <li>• Quick access for procedures</li>
                  <li>• Managed by department head</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-orange-500">
                <p className="font-semibold text-orange-900 mb-2">🔬 Laboratory Store</p>
                <ul className="text-xs text-orange-700 space-y-1">
                  <li>• Reagents and testing kits</li>
                  <li>• Chemicals and glassware</li>
                  <li>• Biohazard waste temporary storage</li>
                  <li>• Managed by lab supervisor</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationsGuide;
