"use client";
import React, { useState } from 'react';
import { Wrench, Search, Trash2, Edit2, Package, CheckCircle, AlertCircle } from 'lucide-react';

const ServicesGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState("services");

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header Section */}
      <div className="flex items-center gap-3 mb-8">
        <Wrench className="w-10 h-10 text-teal-600" />
        <h2 className="text-3xl font-bold text-gray-900">Services Management</h2>
      </div>
      
      <div className="prose max-w-none">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Clinic Services Setup - Complete Guide</h3>
        <p className="text-base text-gray-600 mb-8 leading-relaxed">
          The Services page is the core setup module where all clinic treatments and services are created and managed. 
          This comprehensive guide covers all three tabs: Services, Memberships, and Packages, with detailed explanations 
          of features and best practices.
        </p>
        
        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200 mb-8 rounded-t-lg overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setActiveTab("services")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === "services"
                  ? "border-teal-600 text-teal-700 bg-teal-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              Services
            </button>
            <button
              onClick={() => setActiveTab("memberships")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === "memberships"
                  ? "border-teal-600 text-teal-700 bg-teal-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              Memberships
            </button>
            <button
              onClick={() => setActiveTab("packages")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === "packages"
                  ? "border-teal-600 text-teal-700 bg-teal-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              Packages
            </button>
          </div>
        </div>

        {/* Services Tab Content */}
        {activeTab === "services" && (
          <div className="space-y-8">
            {/* Overview */}
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-l-4 border-teal-500 p-6 rounded-r-lg">
              <h4 className="font-bold text-lg text-teal-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-teal-600 text-white rounded-full text-sm font-bold">1</span>
                Services Tab Overview
              </h4>
              <div className="ml-10 space-y-4">
                <p className="text-base text-teal-800 leading-relaxed">
                  The Services tab allows you to create, view, edit, and delete all clinic services. Services are organized by departments and include pricing, duration, and status information.
                </p>
                <ul className="list-disc list-inside space-y-2 text-base text-teal-700">
                  <li><strong>Create Multiple Services:</strong> Add services in batch with department assignment</li>
                  <li><strong>Service Catalog:</strong> View all services in card format with filtering</li>
                  <li><strong>Edit Functionality:</strong> Update service details inline</li>
                  <li><strong>Delete Services:</strong> Remove services from catalog</li>
                  <li><strong>Search & Filter:</strong> Find services by name or department</li>
                </ul>
                
                {/* Image Section */}
                <div className="w-full bg-teal-50 rounded-xl border border-teal-200 p-6 mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Services Tab Overview
                  </h3>
                  <div className="bg-white rounded-lg border-2 border-teal-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                    <img 
                      src="/services.png" 
                      alt="Services Tab Overview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement?.querySelector('.placeholder-services-overview')?.classList.remove('hidden');
                      }}
                    />
                    <div className="placeholder-services-overview hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50 text-gray-500">
                      <Wrench className="w-16 h-16 mb-4 text-teal-300" />
                      <p className="text-lg font-medium">Services Tab Overview</p>
                      <p className="text-sm mt-2">Screenshot will appear here</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Create New Service Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
              <h4 className="font-bold text-lg text-blue-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">2</span>
                Create New Service
              </h4>
              <div className="ml-10 space-y-4">
                <p className="text-base text-blue-800 leading-relaxed">
                  The "Create New Service" section allows you to add multiple services at once by selecting a department and entering service details:
                </p>
                
                <div className="bg-white rounded-lg border border-blue-200 p-4">
                  <h5 className="font-semibold text-blue-900 mb-3">Required Fields:</h5>
                  <ul className="space-y-2 text-sm text-blue-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span><strong>Department:</strong> Select from dropdown (e.g., Dental, Cardiology, Orthopedics)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span><strong>Service Name:</strong> Descriptive name for the treatment/service</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span><strong>Price (AED):</strong> Standard patient price for the service</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span><strong>Duration (minutes):</strong> Estimated time required for the service</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span><strong>Clinic Price (AED):</strong> Internal clinic cost (optional)</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h5 className="font-semibold text-blue-900 mb-2">Features:</h5>
                  <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                    <li>Add multiple rows for batch service creation</li>
                    <li>Remove individual rows using the trash icon</li>
                    <li>"Create Services" button to save all entries</li>
                    <li>Validation ensures all required fields are filled</li>
                  </ul>
                </div>


              </div>
            </div>

            {/* Service Catalog Section */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 p-6 rounded-r-lg">
              <h4 className="font-bold text-lg text-purple-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full text-sm font-bold">3</span>
                Service Catalog
              </h4>
              <div className="ml-10 space-y-4">
                <p className="text-base text-purple-800 leading-relaxed">
                  The Service Catalog displays all created services in an organized card layout with powerful search and filtering capabilities:
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg border border-purple-200 p-4">
                    <h5 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      Search & Filter
                    </h5>
                    <ul className="space-y-2 text-sm text-purple-700">
                      <li>• Search bar to find services by name</li>
                      <li>• Department filter dropdown</li>
                      <li>• Total service count display</li>
                      <li>• Real-time filtering as you type</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white rounded-lg border border-purple-200 p-4">
                    <h5 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Service Card Details
                    </h5>
                    <ul className="space-y-2 text-sm text-purple-700">
                      <li>• Service name (bold header)</li>
                      <li>• Status badge (Active/Inactive)</li>
                      <li>• Department category tag</li>
                      <li>• Price in AED (prominent display)</li>
                      <li>• Duration in minutes</li>
                      <li>• Clinic price (if set)</li>
                      <li>• Created date</li>
                    </ul>
                  </div>
                </div>


              </div>
            </div>

            {/* Edit & Delete Actions */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 p-6 rounded-r-lg">
              <h4 className="font-bold text-lg text-orange-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-orange-600 text-white rounded-full text-sm font-bold">4</span>
                Edit & Delete Actions
              </h4>
              <div className="ml-10 space-y-4">
                <p className="text-base text-orange-800 leading-relaxed">
                  Each service card includes action buttons for managing services:
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg border border-orange-200 p-4">
                    <h5 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                      <Edit2 className="w-4 h-4" />
                      Edit Service
                    </h5>
                    <p className="text-sm text-orange-700 mb-2">Click "Edit" to modify service details:</p>
                    <ul className="space-y-1 text-sm text-orange-700">
                      <li>• Update service name</li>
                      <li>• Change price and clinic price</li>
                      <li>• Adjust duration</li>
                      <li>• Reassign department</li>
                      <li>• Toggle active/inactive status</li>
                      <li>• Save or cancel changes</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white rounded-lg border border-orange-200 p-4">
                    <h5 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete Service
                    </h5>
                    <p className="text-sm text-orange-700 mb-2">Click trash icon to remove service:</p>
                    <ul className="space-y-1 text-sm text-orange-700">
                      <li>• Confirmation prompt before deletion</li>
                      <li>Permanently removes from catalog</li>
                      <li>May affect linked appointments/packages</li>
                      <li>Use with caution</li>
                    </ul>
                  </div>
                </div>


              </div>
            </div>

            {/* Integration Note */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 rounded-r-lg">
              <h4 className="font-bold text-lg text-green-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                Integration with Other Modules
              </h4>
              <div className="ml-10 space-y-3">
                <p className="text-base text-green-800 leading-relaxed">
                  Services created here are used throughout the clinic management system:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-green-700">
                  <li><strong>Appointments:</strong> Services are booked during appointment scheduling</li>
                  <li><strong>Billing:</strong> Service prices are used for invoice generation</li>
                  <li><strong>Packages:</strong> Services/treatments are bundled into packages</li>
                  <li><strong>Offers:</strong> Services can be discounted in promotional offers</li>
                  <li><strong>Reports:</strong> Service utilization tracked in analytics</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Memberships Tab Content */}
        {activeTab === "memberships" && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 border-l-4 border-teal-500 p-6 rounded-r-lg">
              <h4 className="font-bold text-lg text-teal-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-teal-600 text-white rounded-full text-sm font-bold">1</span>
                Memberships Tab Overview
              </h4>
              <div className="ml-10 space-y-4">
                <p className="text-base text-teal-800 leading-relaxed">
                  The Memberships tab allows you to create and manage membership plans that offer patients benefits like discounts, priority booking, and free consultations.
                </p>
                
                <div className="bg-white rounded-lg border border-teal-200 p-4">
                  <h5 className="font-semibold text-teal-900 mb-3">Membership Features:</h5>
                  <ul className="space-y-2 text-sm text-teal-700">
                    <li>• Set membership name and price</li>
                    <li>• Define duration (e.g., monthly, yearly)</li>
                    <li>• Configure free consultation quota</li>
                    <li>• Set discount percentage for services</li>
                    <li>• Enable priority booking feature</li>
                    <li>• Activate/deactivate memberships</li>
                  </ul>
                </div>

                {/* Image Section */}
                <div className="w-full bg-teal-50 rounded-xl border border-teal-200 p-6 mt-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Memberships Tab Interface
                  </h3>
                  <div className="bg-white rounded-lg border-2 border-teal-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                    <img 
                      src="/mem.png" 
                      alt="Memberships Tab" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement?.querySelector('.placeholder-memberships')?.classList.remove('hidden');
                      }}
                    />
                    <div className="placeholder-memberships hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 text-gray-500">
                      <Wrench className="w-16 h-16 mb-4 text-teal-300" />
                      <p className="text-lg font-medium">Memberships Tab Interface</p>
                      <p className="text-sm mt-2">Screenshot will appear here</p>
                    </div>
                  </div>
                </div>


              </div>
            </div>
          </div>
        )}

        {/* Packages Tab Content */}
        {activeTab === "packages" && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-teal-50 to-indigo-50 border-l-4 border-teal-500 p-6 rounded-r-lg">
              <h4 className="font-bold text-lg text-teal-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-teal-600 text-white rounded-full text-sm font-bold">1</span>
                Packages Tab Overview
              </h4>
              <div className="ml-10 space-y-4">
                <p className="text-base text-teal-800 leading-relaxed">
                  The Packages tab enables you to bundle multiple services/treatments into comprehensive treatment packages at a fixed price.
                </p>
                
                <div className="bg-white rounded-lg border border-teal-200 p-4">
                  <h5 className="font-semibold text-teal-900 mb-3">Package Creation:</h5>
                  <ul className="space-y-2 text-sm text-teal-700">
                    <li>• Enter package name (e.g., "Complete Dental Makeover")</li>
                    <li>• Set total package price</li>
                    <li>• Select treatments from dropdown</li>
                    <li>• Allocate prices to individual treatments</li>
                    <li>• Specify number of sessions per treatment</li>
                    <li>• Total allocated must equal package price</li>
                  </ul>
                </div>

                {/* Image Section */}
                <div className="w-full bg-teal-50 rounded-xl border border-teal-200 p-6 mt-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Packages Tab Interface
                  </h3>
                  <div className="bg-white rounded-lg border-2 border-teal-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                    <img 
                      src="/pac.png" 
                      alt="Packages Tab" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement?.querySelector('.placeholder-packages')?.classList.remove('hidden');
                      }}
                    />
                    <div className="placeholder-packages hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-indigo-50 text-gray-500">
                      <Package className="w-16 h-16 mb-4 text-teal-300" />
                      <p className="text-lg font-medium">Packages Tab Interface</p>
                      <p className="text-sm mt-2">Screenshot will appear here</p>
                    </div>
                  </div>
                </div>


              </div>
            </div>
          </div>
        )}

        {/* Best Practices Section */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-l-4 border-slate-500 p-6 rounded-r-lg mt-8">
          <h4 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            Best Practices
          </h4>
          <div className="ml-10 space-y-3">
            <ul className="list-disc list-inside space-y-2 text-base text-slate-700">
              <li><strong>Organize by Department:</strong> Assign services to appropriate departments for better organization</li>
              <li><strong>Accurate Pricing:</strong> Set competitive and accurate prices for all services</li>
              <li><strong>Realistic Durations:</strong> Estimate service durations accurately for better scheduling</li>
              <li><strong>Regular Updates:</strong> Keep service catalog updated with new treatments</li>
              <li><strong>Monitor Usage:</strong> Track which services are most popular</li>
              <li><strong>Bundle Strategically:</strong> Create packages that offer value while maintaining profitability</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesGuide;
