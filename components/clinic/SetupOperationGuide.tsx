"use client";
import React, { useState } from 'react';
import { ClipboardList, Building2, Users, CheckCircle, AlertCircle, Package } from 'lucide-react';

const SetupOperationGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState("rooms");

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header Section */}
      <div className="flex items-center gap-3 mb-8">
        <ClipboardList className="w-10 h-10 text-teal-600" />
        <h2 className="text-3xl font-bold text-gray-900">Setup & Operation</h2>
      </div>
      
      <div className="prose max-w-none">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Clinic Setup & Operational Configuration Guide</h3>
        <p className="text-base text-gray-600 mb-8 leading-relaxed">
          The Setup & Operation module is where you configure your clinic's physical infrastructure, 
          including rooms, departments, facilities, and operational workflows. This comprehensive guide 
          covers all aspects of clinic setup and configuration.
        </p>

        {/* Quick Navigation */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Quick Navigation
          </h4>
          <div className="grid md:grid-cols-3 gap-3">
            <button
              onClick={() => setActiveSection("rooms")}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                activeSection === "rooms"
                  ? "border-teal-500 bg-teal-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                <span className="font-semibold text-gray-900">Rooms Setup</span>
              </div>
              <p className="text-xs text-gray-600">Create and manage examination rooms</p>
            </button>
            
            <button
              onClick={() => setActiveSection("departments")}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                activeSection === "departments"
                  ? "border-teal-500 bg-teal-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-teal-600" />
                <span className="font-semibold text-gray-900">Departments</span>
              </div>
              <p className="text-xs text-gray-600">Organize clinical departments</p>
            </button>
          </div>
        </div>

        {/* Rooms Setup Section */}
        {activeSection === "rooms" && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
              <h4 className="font-bold text-lg text-blue-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">1</span>
                Rooms Setup Overview
              </h4>
              <div className="ml-10 space-y-4">
                <p className="text-base text-blue-800 leading-relaxed">
                  The Rooms Setup module allows you to create and manage all examination rooms, consultation chambers, 
                  and treatment areas in your clinic. Each room can be configured with specific attributes and capabilities.
                </p>
                
                <div className="bg-white rounded-lg border border-blue-200 p-4">
                  <h5 className="font-semibold text-blue-900 mb-3">Room Configuration Features:</h5>
                  <ul className="space-y-2 text-sm text-blue-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span><strong>Room Name & Number:</strong> Unique identifier for each room</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span><strong>Room Type:</strong> Consultation, Examination, Procedure, Recovery, etc.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span><strong>Capacity:</strong> Maximum number of patients or people</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span><strong>Equipment:</strong> Available medical equipment in the room</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span><strong>Accessibility:</strong> Wheelchair access, special needs accommodations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span><strong>Status:</strong> Active, Inactive, Under Maintenance</span>
                    </li>
                  </ul>
                </div>

                {/* Image Section */}
                <div className="w-full bg-blue-50 rounded-xl border border-blue-200 p-6 mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Rooms Setup Overview
                  </h3>
                  <div className="bg-white rounded-lg border-2 border-blue-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                    <img 
                      src="/room1.png" 
                      alt="Rooms Setup Interface" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement?.querySelector('.placeholder-rooms')?.classList.remove('hidden');
                      }}
                    />
                    <div className="placeholder-rooms hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-500">
                      <Building2 className="w-16 h-16 mb-4 text-blue-300" />
                      <p className="text-lg font-medium">Rooms Setup Interface</p>
                      <p className="text-sm mt-2">Screenshot will appear here</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Creating Rooms */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 rounded-r-lg">
              <h4 className="font-bold text-lg text-green-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm font-bold">2</span>
                Creating New Rooms
              </h4>
              <div className="ml-10 space-y-4">
                <p className="text-base text-green-800 leading-relaxed">
                  Follow these steps to add new rooms to your clinic:
                </p>
                
                <div className="bg-white rounded-lg border border-green-200 p-4">
                  <h5 className="font-semibold text-green-900 mb-3">Step-by-Step Process:</h5>
                  <ol className="list-decimal list-inside space-y-3 text-sm text-green-700">
                    <li><strong>Click "Add Room" button</strong> - Located in the Rooms section</li>
                    <li><strong>Enter room details:</strong>
                      <ul className="list-disc list-inside ml-5 mt-1 space-y-1">
                        <li>Room name/number (e.g., "Consultation Room 1")</li>
                        <li>Select room type from dropdown</li>
                        <li>Set maximum capacity</li>
                        <li>Choose floor/location within clinic</li>
                      </ul>
                    </li>
                    <li><strong>Configure equipment:</strong>
                      <ul className="list-disc list-inside ml-5 mt-1 space-y-1">
                        <li>Select available medical equipment</li>
                        <li>Add custom equipment if needed</li>
                      </ul>
                    </li>
                    <li><strong>Set accessibility options:</strong>
                      <ul className="list-disc list-inside ml-5 mt-1 space-y-1">
                        <li>Wheelchair accessible</li>
                        <li>Special needs support</li>
                      </ul>
                    </li>
                    <li><strong>Save the room</strong> - Click "Create Room" to save</li>
                  </ol>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h5 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Important Notes:
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                    <li>Each room must have a unique name/number</li>
                    <li>Room capacity affects appointment scheduling</li>
                    <li>Equipment availability impacts service assignment</li>
                    <li>Inactive rooms won't appear in appointment booking</li>
                  </ul>
                </div>


              </div>
            </div>

            {/* Room Management */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 p-6 rounded-r-lg">
              <h4 className="font-bold text-lg text-purple-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full text-sm font-bold">3</span>
                Room Management
              </h4>
              <div className="ml-10 space-y-4">
                <p className="text-base text-purple-800 leading-relaxed">
                  Manage existing rooms with these features:
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg border border-purple-200 p-4">
                    <h5 className="font-semibold text-purple-900 mb-3">Edit Rooms:</h5>
                    <ul className="space-y-2 text-sm text-purple-700">
                      <li>• Update room details and configuration</li>
                      <li>• Change room type or capacity</li>
                      <li>• Modify equipment list</li>
                      <li>• Toggle active/inactive status</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white rounded-lg border border-purple-200 p-4">
                    <h5 className="font-semibold text-purple-900 mb-3">Room Actions:</h5>
                    <ul className="space-y-2 text-sm text-purple-700">
                      <li>• View room schedule</li>
                      <li>• Set maintenance periods</li>
                      <li>• Track utilization metrics</li>
                      <li>• Archive unused rooms</li>
                    </ul>
                  </div>
                </div>


              </div>
            </div>
          </div>
        )}

        {/* Departments Section */}
        {activeSection === "departments" && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-l-4 border-teal-500 p-6 rounded-r-lg">
              <h4 className="font-bold text-lg text-teal-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-teal-600 text-white rounded-full text-sm font-bold">1</span>
                Departments Configuration
              </h4>
              <div className="ml-10 space-y-4">
                <p className="text-base text-teal-800 leading-relaxed">
                  Organize your clinic into departments for better management and workflow optimization. 
                  Departments help categorize services, assign staff, and track performance.
                </p>
                
                <div className="bg-white rounded-lg border border-teal-200 p-4">
                  <h5 className="font-semibold text-teal-900 mb-3">Common Clinic Departments:</h5>
                  <div className="grid md:grid-cols-2 gap-3 text-sm text-teal-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Dental / Odontology</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Cardiology</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Orthopedics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Pediatrics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Dermatology</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Neurology</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Ophthalmology</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>General Practice</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-teal-200 p-4 mt-4">
                  <h5 className="font-semibold text-teal-900 mb-3">Department Setup:</h5>
                  <ul className="space-y-2 text-sm text-teal-700">
                    <li><strong>Department Name:</strong> Clear, descriptive name</li>
                    <li><strong>Department Head:</strong> Assign lead doctor/consultant</li>
                    <li><strong>Staff Assignment:</strong> Add doctors, nurses, and support staff</li>
                    <li><strong>Services Link:</strong> Associate services with department</li>
                    <li><strong>Working Hours:</strong> Set department-specific schedules</li>
                    <li><strong>Contact Info:</strong> Internal extension or direct line</li>
                  </ul>
                </div>

                {/* Image Section */}
                <div className="w-full bg-teal-50 rounded-xl border border-teal-200 p-6 mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Departments Configuration
                  </h3>
                  <div className="bg-white rounded-lg border-2 border-teal-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                    <img 
                      src="/dep.png" 
                      alt="Departments Setup" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement?.querySelector('.placeholder-departments')?.classList.remove('hidden');
                      }}
                    />
                    <div className="placeholder-departments hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50 text-gray-500">
                      <Users className="w-16 h-16 mb-4 text-teal-300" />
                      <p className="text-lg font-medium">Departments Configuration</p>
                      <p className="text-sm mt-2">Screenshot will appear here</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Department Management */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 p-6 rounded-r-lg">
              <h4 className="font-bold text-lg text-orange-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-orange-600 text-white rounded-full text-sm font-bold">2</span>
                Department Management
              </h4>
              <div className="ml-10 space-y-4">
                <p className="text-base text-orange-800 leading-relaxed">
                  Effective department management ensures smooth clinic operations:
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg border border-orange-200 p-4">
                    <h5 className="font-semibold text-orange-900 mb-3">Key Features:</h5>
                    <ul className="space-y-2 text-sm text-orange-700">
                      <li>• Edit department details</li>
                      <li>• Reassign department head</li>
                      <li>• Manage staff rosters</li>
                      <li>• Update working hours</li>
                      <li>• Add/remove services</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white rounded-lg border border-orange-200 p-4">
                    <h5 className="font-semibold text-orange-900 mb-3">Analytics:</h5>
                    <ul className="space-y-2 text-sm text-orange-700">
                      <li>• Patient volume by department</li>
                      <li>• Revenue tracking</li>
                      <li>• Staff performance metrics</li>
                      <li>• Resource utilization</li>
                    </ul>
                  </div>
                </div>


              </div>
            </div>
          </div>
        )}



        {/* Best Practices Section */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-l-4 border-slate-500 p-6 rounded-r-lg mt-8">
          <h4 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6" />
            Setup & Operation Best Practices
          </h4>
          <div className="ml-10 space-y-3">
            <ul className="list-disc list-inside space-y-2 text-base text-slate-700">
              <li><strong>Plan Ahead:</strong> Map out your clinic layout before creating rooms</li>
              <li><strong>Standardize Naming:</strong> Use consistent naming conventions for rooms and equipment</li>
              <li><strong>Department Alignment:</strong> Align departments with your organizational structure</li>
              <li><strong>Regular Audits:</strong> Conduct periodic equipment and facility audits</li>
              <li><strong>Maintenance Logs:</strong> Keep detailed records of all maintenance activities</li>
              <li><strong>Staff Training:</strong> Ensure staff knows how to use and report issues with equipment</li>
              <li><strong>Compliance:</strong> Follow regulatory guidelines for equipment maintenance and safety</li>
              <li><strong>Scalability:</strong> Design your setup to accommodate future growth</li>
            </ul>
          </div>
        </div>

        {/* Integration Note */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 rounded-r-lg mt-8">
          <h4 className="font-bold text-lg text-green-900 mb-4 flex items-center gap-2">
            <Package className="w-6 h-6" />
            How Setup Affects Other Modules
          </h4>
          <div className="ml-10 space-y-3">
            <p className="text-base text-green-800 leading-relaxed">
              Proper setup and configuration impacts all clinic operations:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-green-700">
              <li><strong>Appointments:</strong> Room availability determines booking slots</li>
              <li><strong>Services:</strong> Departments organize service categories</li>
              <li><strong>Billing:</strong> Equipment usage may affect pricing</li>
              <li><strong>Reports:</strong> Utilization metrics inform decision-making</li>
              <li><strong>Staff Scheduling:</strong> Department assignments guide roster creation</li>
              <li><strong>Inventory:</strong> Equipment tracking integrates with stock management</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupOperationGuide;
