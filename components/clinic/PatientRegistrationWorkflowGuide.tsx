"use client";
import React from 'react';
import { UserPlus, Filter, Edit, Eye, Trash2, Info, CheckCircle, FileText, CreditCard, Calendar, Package, Shield, Image as ImageIcon, MessageSquare, Settings, AlertCircle } from 'lucide-react';

const PatientRegistrationWorkflowGuide: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-8 px-6 sm:px-8 lg:px-12 text-white">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">Patient Registration & Profile Guide</h1>
          <p className="text-blue-100 text-sm mt-2 opacity-90">Manage patient registration, import existing patients, and maintain comprehensive profiles.</p>
        </div>
      </div>

      {/* UI Preview Section - Patient Registration */}
      <div className="w-full border-b border-gray-200 px-6 sm:px-8 lg:px-12 py-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Patient Registration Interface
          </h2>
          <div className="aspect-video bg-gray-100 rounded-lg border-2 border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group">
            <img 
              src="/all-patient.png" 
              alt="Patient Registration Screen" 
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement?.querySelector('.placeholder-content')?.classList.remove('hidden');
              }}
            />
            <div className="placeholder-content hidden text-center p-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-gray-600 font-medium">Image not found: /patient-registration.png</p>
              <p className="text-gray-400 text-sm mt-2">Please ensure patient-registration.png is in the public folder.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Explanation Section */}
      <div className="w-full px-6 sm:px-8 lg:px-12 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Info className="w-6 h-6 text-blue-600" />
            Workflow Breakdown
          </h2>

          {/* Section 1: Patient Registration */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              1. Patient Registration
            </h3>
            
            {/* Image Section */}
            <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 mb-6">
              <h4 className="text-lg font-bold text-gray-800 mb-4">Patient Registration Form</h4>
              <div className="aspect-video bg-white rounded-lg border-2 border-blue-200 flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
                <img 
                  src="/reg.png" 
                  alt="Patient Registration Form" 
                  className="w-full h-full object-contain p-4"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.querySelector('.placeholder-reg-form')?.classList.remove('hidden');
                  }}
                />
                <div className="placeholder-reg-form hidden text-center p-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-gray-600 font-medium">Image not found: /patient-registration-form.png</p>
                  <p className="text-gray-400 text-sm mt-2">Please ensure patient-registration-form.png is in the public folder.</p>
                </div>
              </div>
            </div>

            {/* Detailed Explanation */}
            <div className="bg-white rounded-xl p-6 border-l-4 border-blue-500 shadow-sm space-y-4">
              <p className="text-gray-600 leading-relaxed">
                The Patient Registration form captures essential patient information in a structured workflow, ensuring complete data collection and seamless EMR generation.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Basic Information Section
                  </h4>
                  <ul className="list-disc list-inside ml-4 space-y-2 text-gray-600 text-sm">
                    <li><strong>Personal Details:</strong> Capture patient's full name, date of birth, gender, age, and marital status.</li>
                    <li><strong>Contact Information:</strong> Enter phone number, email address, and residential address with city/state/pincode.</li>
                    <li><strong>Emergency Contact:</strong> Add emergency contact person details including name, relationship, and phone number.</li>
                    <li><strong>Occupation & Education:</strong> Record patient's occupation, employer details, and educational background.</li>
                    <li><strong>Referral Source:</strong> Track how the patient found the clinic (self-referral, doctor referral, online search, etc.).</li>
                    <li><strong>Photo Upload:</strong> Optional patient photograph upload for identification purposes.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Auto-Generated EMR (Electronic Medical Record)
                  </h4>
                  <ul className="list-disc list-inside ml-4 space-y-2 text-gray-600 text-sm">
                    <li><strong>Unique Patient ID:</strong> System automatically generates a unique patient identifier upon registration.</li>
                    <li><strong>Medical History Template:</strong> Pre-populated medical history form ready for completion on next page.</li>
                    <li><strong>Allergies Section:</strong> Dedicated field to record known allergies (medications, food, environmental).</li>
                    <li><strong>Chronic Conditions:</strong> Checklist for common chronic diseases (diabetes, hypertension, asthma, etc.).</li>
                    <li><strong>Previous Surgeries:</strong> Space to document any past surgical procedures with dates.</li>
                    <li><strong>Current Medications:</strong> List ongoing medications with dosage and frequency.</li>
                    <li><strong>Family Medical History:</strong> Record hereditary conditions and family health patterns.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4" /> Membership, Package & Insurance Addition
                  </h4>
                  <ul className="list-disc list-inside ml-4 space-y-2 text-gray-600 text-sm">
                    <li><strong>Membership Plans:</strong> Select from available membership tiers (Silver, Gold, Platinum) with associated benefits.</li>
                    <li><strong>Wellness Packages:</strong> Choose pre-defined treatment packages or create custom package bundles.</li>
                    <li><strong>Package Sessions:</strong> Define number of sessions included in the package with validity period.</li>
                    <li><strong>Insurance Provider:</strong> Select insurance company from integrated provider list or add manually.</li>
                    <li><strong>Policy Details:</strong> Enter policy number, group number, coverage type, and expiry date.</li>
                    <li><strong>Coverage Limits:</strong> Specify annual limits, co-pay percentages, and covered services.</li>
                    <li><strong>Pre-Authorization:</strong> Flag treatments requiring insurance pre-approval before proceeding.</li>
                    <li><strong>Card Upload:</strong> Upload insurance card images for quick reference during billing.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Save & Continue Functionality
                  </h4>
                  <ul className="list-disc list-inside ml-4 space-y-2 text-gray-600 text-sm">
                    <li><strong>Save Draft:</strong> Option to save incomplete registration as draft for later completion.</li>
                    <li><strong>Validation Checks:</strong> Real-time validation ensures all required fields are completed before saving.</li>
                    <li><strong>Duplicate Detection:</strong> System checks for existing patients with matching phone/email to prevent duplicates.</li>
                    <li><strong>Auto-Save:</strong> Automatic draft saving every 30 seconds to prevent data loss.</li>
                    <li><strong>Save & Continue:</strong> Click "Save & Continue" button to proceed to the next page for additional details.</li>
                    <li><strong>Success Notification:</strong> Confirmation message displays upon successful registration with patient ID.</li>
                    <li><strong>Quick Actions:</strong> After saving, access quick actions like "Book Appointment", "Add Treatment", or "View Profile".</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Patient Import */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600" />
              2. Patient Import & Bulk Operations
            </h3>
            <p className="text-gray-600 leading-relaxed">
              The Patient Import feature allows you to add new patients to your clinic database and import existing patient records from external sources.
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-600">
              <li><strong>Add New Patients:</strong> Click "Add Patient" button to register new patients with complete demographic and medical information.</li>
              <li><strong>Import Existing Patients:</strong> Use the import feature to bulk upload patient records from CSV/Excel files or other EMR systems.</li>
              <li><strong>Quick Search:</strong> Search for existing patients by name, phone number, email, or patient ID before creating duplicates.</li>
              <li><strong>Data Validation:</strong> System automatically validates required fields and checks for duplicate entries.</li>
            </ul>
          </div>

          {/* Section 2: Filter Options */}
          <div className="space-y-4 bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h3 className="text-xl font-semibold text-blue-800 flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600" />
              2. Advanced Filtering Options
            </h3>
            <p className="text-blue-900 leading-relaxed">
              Use powerful filters to quickly find specific patient groups based on their status and membership details.
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                <h4 className="font-bold text-blue-700 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Priority Filters
                </h4>
                <ul className="text-xs mt-2 space-y-1 text-gray-700">
                  <li>• <strong>Priority Patients:</strong> High-priority cases requiring immediate attention</li>
                  <li>• <strong>Non-Priority:</strong> Regular patients with standard scheduling</li>
                  <li>• <strong>Emergency Cases:</strong> Critical patients needing urgent care</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                <h4 className="font-bold text-blue-700 mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Membership Filters
                </h4>
                <ul className="text-xs mt-2 space-y-1 text-gray-700">
                  <li>• <strong>Active Membership:</strong> Patients with current wellness plans</li>
                  <li>• <strong>No Membership:</strong> Patients without any active packages</li>
                  <li>• <strong>Previous Membership:</strong> Patients with expired or past memberships</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                <h4 className="font-bold text-blue-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Status Filters
                </h4>
                <ul className="text-xs mt-2 space-y-1 text-gray-700">
                  <li>• <strong>Active Patients:</strong> Recently visited or scheduled patients</li>
                  <li>• <strong>Inactive Patients:</strong> No recent activity or visits</li>
                  <li>• <strong>New Registrations:</strong> Recently added patients (last 30 days)</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                <h4 className="font-bold text-blue-700 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Insurance Filters
                </h4>
                <ul className="text-xs mt-2 space-y-1 text-gray-700">
                  <li>• <strong>Insured Patients:</strong> Patients with active insurance coverage</li>
                  <li>• <strong>Self-Pay:</strong> Patients paying out-of-pocket</li>
                  <li>• <strong>Claim Pending:</strong> Insurance claims awaiting approval</li>
                </ul>
              </div>
            </div>
          </div>

          <hr className="border-gray-200 my-8" />

          {/* Actions Section */}
          <div className="w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 pt-4">
              <Settings className="w-6 h-6 text-purple-600" />
              Patient Actions & Management
            </h2>

            {/* UI Preview Section for Actions */}
            <div className="w-full bg-purple-50 rounded-xl border border-purple-100 p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Patient Actions Menu
              </h3>
              <div className="aspect-video bg-white rounded-lg border-2 border-purple-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm">
                <img 
                  src="/patient-actions.png" 
                  alt="Patient Actions Menu" 
                  className="w-full h-full object-contain p-4"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.querySelector('.placeholder-content-actions')?.classList.remove('hidden');
                  }}
                />
                <div className="placeholder-content-actions hidden text-center p-8">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Settings className="w-8 h-8 text-purple-600" />
                  </div>
                  <p className="text-gray-600 font-medium">Image not found: /patient-actions.png</p>
                  <p className="text-gray-400 text-sm mt-2">Please ensure patient-actions.png is in the public folder.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-gray-600 leading-relaxed">
                Each patient record includes an actions menu that provides quick access to essential management functions.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6">
                {/* Edit Action */}
                <div className="p-5 rounded-xl border border-green-100 bg-green-50/30">
                  <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                    <Edit className="w-4 h-4 text-green-600" /> Edit Patient
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Update personal details (name, contact, address)</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Modify medical history and allergies</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Change insurance information</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Update emergency contacts</span>
                    </li>
                  </ul>
                </div>

                {/* View Action */}
                <div className="p-5 rounded-xl border border-blue-100 bg-blue-50/30">
                  <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-600" /> View Profile
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Access complete patient profile dashboard</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>View treatment history and progress</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Review billing and payment records</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Check upcoming appointments</span>
                    </li>
                  </ul>
                </div>

                {/* Delete Action */}
                <div className="p-5 rounded-xl border border-red-100 bg-red-50/30">
                  <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-600" /> Delete Patient
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span>Permanently remove patient record (with confirmation)</span>
                    </li>
                    <li className="flex gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span>Archive option available for compliance</span>
                    </li>
                    <li className="flex gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span>Requires admin authorization</span>
                    </li>
                    <li className="flex gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span>Creates audit trail entry</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-200 my-8" />

          {/* Patient Profile View Section */}
          <div className="w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 pt-4">
              <FileText className="w-6 h-6 text-teal-600" />
              Patient Profile View - Complete Overview
            </h2>

            {/* UI Preview Section for Profile View */}
            <div className="w-full bg-teal-50 rounded-xl border border-teal-100 p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Patient Profile Dashboard
              </h3>
              <div className="aspect-video bg-white rounded-lg border-2 border-teal-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm">
                <img 
                  src="/profile.png" 
                  alt="Patient Profile View" 
                  className="w-full h-full object-contain p-4"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.querySelector('.placeholder-content-profile')?.classList.remove('hidden');
                  }}
                />
                <div className="placeholder-content-profile hidden text-center p-8">
                  <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-teal-600" />
                  </div>
                  <p className="text-gray-600 font-medium">Image not found: /patient-profile-view.png</p>
                  <p className="text-gray-400 text-sm mt-2">Please ensure patient-profile-view.png is in the public folder.</p>
                </div>
              </div>
            </div>

            {/* Detailed Profile Sections */}
            <div className="space-y-6">
              <p className="text-gray-600 leading-relaxed">
                The Patient Profile View provides a comprehensive dashboard with all patient information organized into logical sections for easy navigation and management.
              </p>

              {/* Section Headings with Detailed Explanations */}
              <div className="space-y-8">
                
                {/* 1. Overview */}
                <div className="bg-white rounded-xl p-6 border-l-4 border-blue-500 shadow-sm">
                  <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2 text-lg">
                    <Info className="w-5 h-5" />
                    1. Overview
                  </h4>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <span className="text-blue-600 font-bold text-xl">•</span>
                      <div><strong>Patient Demographics:</strong> Display basic information including name, age, gender, date of birth, and contact details.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-600 font-bold text-xl">•</span>
                      <div><strong>Medical Summary:</strong> Quick view of primary conditions, allergies, blood type, and chronic diseases.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-600 font-bold text-xl">•</span>
                      <div><strong>Emergency Contacts:</strong> List of emergency contact persons with relationship and phone numbers.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-600 font-bold text-xl">•</span>
                      <div><strong>Patient ID & Registration Date:</strong> Unique identifier and account creation timestamp.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-600 font-bold text-xl">•</span>
                      <div><strong>Status Indicators:</strong> Visual badges showing priority level, membership status, and insurance coverage.</div>
                    </li>
                  </ul>
                </div>

                {/* 2. Treatments */}
                <div className="bg-white rounded-xl p-6 border-l-4 border-green-500 shadow-sm">
                  <h4 className="font-bold text-green-800 mb-4 flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5" />
                    2. Treatments
                  </h4>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold text-xl">•</span>
                      <div><strong>Treatment History:</strong> Chronological list of all treatments and procedures performed.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold text-xl">•</span>
                      <div><strong>Current Treatments:</strong> Active treatment plans with progress tracking and next session dates.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold text-xl">•</span>
                      <div><strong>Treatment Notes:</strong> Detailed clinical notes from each session including observations and outcomes.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold text-xl">•</span>
                      <div><strong>Before/After Images:</strong> Visual documentation of treatment results with comparison views.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold text-xl">•</span>
                      <div><strong>Prescriptions:</strong> History of medications prescribed with dosage and duration details.</div>
                    </li>
                  </ul>
                </div>

                {/* 3. Billing */}
                <div className="bg-white rounded-xl p-6 border-l-4 border-purple-500 shadow-sm">
                  <h4 className="font-bold text-purple-800 mb-4 flex items-center gap-2 text-lg">
                    <CreditCard className="w-5 h-5" />
                    3. Billing
                  </h4>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold text-xl">•</span>
                      <div><strong>Invoice History:</strong> Complete list of all invoices generated with amounts, dates, and payment status.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold text-xl">•</span>
                      <div><strong>Payment Records:</strong> Detailed payment transactions including method, amount paid, and pending balance.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold text-xl">•</span>
                      <div><strong>Outstanding Balance:</strong> Current unpaid amount with breakdown of services and due dates.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold text-xl">•</span>
                      <div><strong>Payment Plans:</strong> Active installment plans with schedule and remaining payments.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold text-xl">•</span>
                      <div><strong>Refunds & Adjustments:</strong> Record of any refunds issued or billing adjustments made.</div>
                    </li>
                  </ul>
                </div>

                {/* 4. Appointments */}
                <div className="bg-white rounded-xl p-6 border-l-4 border-orange-500 shadow-sm">
                  <h4 className="font-bold text-orange-800 mb-4 flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5" />
                    4. Appointments
                  </h4>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <span className="text-orange-600 font-bold text-xl">•</span>
                      <div><strong>Upcoming Appointments:</strong> Scheduled future visits with date, time, doctor, and service details.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-orange-600 font-bold text-xl">•</span>
                      <div><strong>Past Appointments:</strong> Historical appointment records with attendance status and notes.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-orange-600 font-bold text-xl">•</span>
                      <div><strong>Appointment History:</strong> Complete timeline of all bookings, cancellations, and reschedules.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-orange-600 font-bold text-xl">•</span>
                      <div><strong>No-Show Records:</strong> Track missed appointments and patterns for follow-up.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-orange-600 font-bold text-xl">•</span>
                      <div><strong>Quick Booking:</strong> Schedule new appointments directly from the profile view.</div>
                    </li>
                  </ul>
                </div>

                {/* 5. Package & Membership */}
                <div className="bg-white rounded-xl p-6 border-l-4 border-teal-500 shadow-sm">
                  <h4 className="font-bold text-teal-800 mb-4 flex items-center gap-2 text-lg">
                    <Package className="w-5 h-5" />
                    5. Package & Membership
                  </h4>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <span className="text-teal-600 font-bold text-xl">•</span>
                      <div><strong>Active Packages:</strong> Current wellness packages with sessions utilized vs. remaining.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-teal-600 font-bold text-xl">•</span>
                      <div><strong>Membership Plans:</strong> Active membership subscriptions with benefits and expiry dates.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-teal-600 font-bold text-xl">•</span>
                      <div><strong>Package History:</strong> Previously purchased packages and their completion status.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-teal-600 font-bold text-xl">•</span>
                      <div><strong>Renewal Alerts:</strong> Notifications for expiring packages and memberships.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-teal-600 font-bold text-xl">•</span>
                      <div><strong>Upgrade Options:</strong> Available package upgrades and cross-sell opportunities.</div>
                    </li>
                  </ul>
                </div>

                {/* 6. Insurance */}
                <div className="bg-white rounded-xl p-6 border-l-4 border-indigo-500 shadow-sm">
                  <h4 className="font-bold text-indigo-800 mb-4 flex items-center gap-2 text-lg">
                    <Shield className="w-5 h-5" />
                    6. Insurance
                  </h4>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <span className="text-indigo-600 font-bold text-xl">•</span>
                      <div><strong>Insurance Provider:</strong> Details of insurance company, policy number, and coverage type.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-indigo-600 font-bold text-xl">•</span>
                      <div><strong>Coverage Details:</strong> Covered services, co-pay percentages, and annual limits.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-indigo-600 font-bold text-xl">•</span>
                      <div><strong>Claims History:</strong> Record of submitted claims with approval/rejection status.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-indigo-600 font-bold text-xl">•</span>
                      <div><strong>Pending Claims:</strong> Claims currently under review with expected resolution dates.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-indigo-600 font-bold text-xl">•</span>
                      <div><strong>Pre-Authorizations:</strong> Required approvals for specific treatments or procedures.</div>
                    </li>
                  </ul>
                </div>

                {/* 7. Media & Documents */}
                <div className="bg-white rounded-xl p-6 border-l-4 border-pink-500 shadow-sm">
                  <h4 className="font-bold text-pink-800 mb-4 flex items-center gap-2 text-lg">
                    <ImageIcon className="w-5 h-5" />
                    7. Media & Documents
                  </h4>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <span className="text-pink-600 font-bold text-xl">•</span>
                      <div><strong>Clinical Photos:</strong> Before/after treatment images organized by date and procedure.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-pink-600 font-bold text-xl">•</span>
                      <div><strong>Medical Reports:</strong> Lab reports, diagnostic scans, and specialist consultations.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-pink-600 font-bold text-xl">•</span>
                      <div><strong>Consent Forms:</strong> Signed digital consent forms for treatments and procedures.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-pink-600 font-bold text-xl">•</span>
                      <div><strong>ID Documents:</strong> Patient identification, insurance cards, and referral letters.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-pink-600 font-bold text-xl">•</span>
                      <div><strong>Document Upload:</strong> Easy drag-and-drop interface for adding new files.</div>
                    </li>
                  </ul>
                </div>

                {/* 8. Communication Log */}
                <div className="bg-white rounded-xl p-6 border-l-4 border-yellow-500 shadow-sm">
                  <h4 className="font-bold text-yellow-800 mb-4 flex items-center gap-2 text-lg">
                    <MessageSquare className="w-5 h-5" />
                    8. Communication Log
                  </h4>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <span className="text-yellow-600 font-bold text-xl">•</span>
                      <div><strong>SMS History:</strong> All SMS messages sent to patient with delivery status and timestamps.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-yellow-600 font-bold text-xl">•</span>
                      <div><strong>Email Communications:</strong> Email correspondence including appointment reminders and invoices.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-yellow-600 font-bold text-xl">•</span>
                      <div><strong>WhatsApp Messages:</strong> Chat history and media shared via WhatsApp integration.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-yellow-600 font-bold text-xl">•</span>
                      <div><strong>Call Logs:</strong> Record of phone calls with duration and notes.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-yellow-600 font-bold text-xl">•</span>
                      <div><strong>Internal Notes:</strong> Staff comments and follow-up reminders visible to team members.</div>
                    </li>
                  </ul>
                </div>

                {/* 9. Advance & Pending Balance */}
                <div className="bg-white rounded-xl p-6 border-l-4 border-red-500 shadow-sm">
                  <h4 className="font-bold text-red-800 mb-4 flex items-center gap-2 text-lg">
                    <AlertCircle className="w-5 h-5" />
                    9. Advance & Pending Balance
                  </h4>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <span className="text-red-600 font-bold text-xl">•</span>
                      <div><strong>Advance Balance:</strong> Prepaid amount available for future services and treatments.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-600 font-bold text-xl">•</span>
                      <div><strong>Pending Dues:</strong> Outstanding payments from previous visits or treatments.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-600 font-bold text-xl">•</span>
                      <div><strong>Balance History:</strong> Transaction log showing all advances added and deductions made.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-600 font-bold text-xl">•</span>
                      <div><strong>Quick Payment:</strong> Accept advance payments or settle pending balances instantly.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-600 font-bold text-xl">•</span>
                      <div><strong>Auto-Deduction:</strong> Automatically deduct costs from advance balance during billing.</div>
                    </li>
                  </ul>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PatientRegistrationWorkflowGuide;
