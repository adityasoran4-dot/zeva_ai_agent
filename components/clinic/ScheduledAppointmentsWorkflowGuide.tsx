"use client";
import React from 'react';
import { MoreVertical, FileText, Activity, Stethoscope, Info, CheckCircle, Image as ImageIcon, Pill, Layout,  List, Package, Send, CalendarCheck, Lightbulb, MessageSquare, DollarSign, CreditCard, Receipt, Brain, Wallet, Filter,  History, BookOpen } from 'lucide-react';

const ScheduledAppointmentsWorkflowGuide: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 py-8 px-6 sm:px-8 lg:px-12 text-white">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">Scheduled Appointments Workflow Guide</h1>
          <p className="text-emerald-100 text-sm mt-2 opacity-90">Manage patient visits, record medical complaints, and track EMR history.</p>
        </div>
      </div>

      {/* UI Preview Section */}
      <div className="w-full border-b border-gray-200 px-6 sm:px-8 lg:px-12 py-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Scheduled Appointments Interface
          </h2>
          <div className="aspect-video bg-gray-100 rounded-lg border-2 border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group">
            <img 
              src="/image2.png" 
              alt="Scheduled Appointments UI" 
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement?.querySelector('.placeholder-content')?.classList.remove('hidden');
              }}
            />
            <div className="placeholder-content hidden text-center p-8">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layout className="w-8 h-8 text-teal-600" />
              </div>
              <p className="text-gray-600 font-medium">Image not found: /image2.png</p>
              <p className="text-gray-400 text-sm mt-2">Please ensure image2.png is in the public folder.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Explanation Section */}
      <div className="w-full px-6 sm:px-8 lg:px-12 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Info className="w-6 h-6 text-teal-600" />
            Workflow Breakdown
          </h2>

          {/* Section 1: All Appointments List */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <List className="w-5 h-5 text-teal-600" />
              1. Managing the Appointments List
            </h3>
            <p className="text-gray-600 leading-relaxed">
              The "Scheduled Appointments" page displays a comprehensive list of all patient visits. This list is your primary tool for tracking daily clinic operations.
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-600">
              <li><strong>Search & Filtering:</strong> Use the search bar to find patients by name or EMR number. The <Filter className="inline w-4 h-4" /> <strong>Filter</strong> button allows you to narrow down results by date range, doctor, room, and status (e.g., Arrived, Completed, Cancelled).</li>
              <li><strong>Data Visibility:</strong> Each row shows essential details: Patient Name, EMR Number, Invoice Number, Doctor/Room assigned, and the current Status.</li>
            </ul>
          </div>

          {/* Section 2: Action Menu */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <MoreVertical className="w-5 h-5 text-gray-600" />
              2. Quick Actions
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Clicking the <MoreVertical className="inline w-4 h-4" /> <strong>Vertical Dots</strong> at the end of each row opens a menu with critical management options:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-600">
              <li><strong>Edit Appointment:</strong> Modify the date, time, or assigned doctor/room.</li>
              <li><strong>History:</strong> View the audit trail of all changes made to the appointment.</li>
              <li><strong>Billing:</strong> Access the financial details and payment status for the visit.</li>
              <li><strong>Complaints / EMR:</strong> Record medical details for the consultation.</li>
            </ul>
          </div>

          {/* Section 3: The Complaint & EMR Modal */}
          <div className="space-y-4 bg-teal-50 p-6 rounded-xl border border-teal-100">
            <h3 className="text-xl font-semibold text-teal-800 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-600" />
              3. Consultation & EMR Recording
            </h3>
            <p className="text-teal-900 leading-relaxed">
              The <strong>Appointment Complaint Modal</strong> is the most important tool for doctors and clinical staff during a consultation.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-teal-200">
                <h4 className="font-bold text-teal-700 mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Vital Signs
                </h4>
                <p className="text-xs text-gray-600">Record and track patient health metrics:</p>
                <ul className="text-xs mt-2 space-y-1 text-gray-700">
                  <li>• Temperature, Pulse, Blood Pressure</li>
                  <li>• Weight, Height, BMI calculation</li>
                  <li>• SpO2, Respiratory Rate</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-teal-200">
                <h4 className="font-bold text-teal-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Medical Complaints
                </h4>
                <p className="text-xs text-gray-600">Document the reason for the visit:</p>
                <ul className="text-xs mt-2 space-y-1 text-gray-700">
                  <li>• Detailed text input for patient issues</li>
                  <li>• View <strong>Previous History</strong> to sync EMR data</li>
                  <li>• Track progress across multiple visits</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-teal-200">
                <h4 className="font-bold text-teal-700 mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Clinical Images
                </h4>
                <p className="text-xs text-gray-600">Visual documentation of treatment:</p>
                <ul className="text-xs mt-2 space-y-1 text-gray-700">
                  <li>• Upload "Before" treatment photos</li>
                  <li>• Upload "After" treatment results</li>
                  <li>• Visual proof for medical records</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-teal-200">
                <h4 className="font-bold text-teal-700 mb-2 flex items-center gap-2">
                  <Pill className="w-4 h-4" /> Resource Usage
                </h4>
                <p className="text-xs text-gray-600">Inventory and service tracking:</p>
                <ul className="text-xs mt-2 space-y-1 text-gray-700">
                  <li>• Link stock items/medications used</li>
                  <li>• Automatically deduct from inventory</li>
                  <li>• Track costs associated with treatments</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 4: System Behaviors */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              4. System Behaviors & Syncing
            </h3>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-600">
              <li><strong>Real-time Status Updates:</strong> Changing an appointment status in the list instantly updates the scheduler view.</li>
              <li><strong>EMR Integration:</strong> Every vital sign and complaint recorded is automatically saved to the patient's permanent medical file.</li>
              <li><strong>Auto-Calculations:</strong> The system automatically calculates BMI based on height and weight inputs.</li>
              <li><strong>Access Control:</strong> Only authorized clinical staff can view or edit sensitive EMR data.</li>
            </ul>
          </div>

          <hr className="border-gray-200 my-8" />

          {/* New Section: Detailed Complaints Module Guide */}
          <div className="w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 pt-4">
              <MessageSquare className="w-6 h-6 text-purple-600" />
              Detailed Complaints Module Guide
            </h2>

            {/* UI Preview Section for Complaints Module */}
            <div className="w-full bg-purple-50 rounded-xl border border-purple-100 p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Complaints Module Interface
              </h3>
              <div className="aspect-video bg-white rounded-lg border-2 border-purple-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm">
                <img 
                  src="/im.png" 
                  alt="Complaints Module UI" 
                  className="w-full h-full object-contain p-4"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.querySelector('.placeholder-content')?.classList.remove('hidden');
                  }}
                />
                <div className="placeholder-content hidden text-center p-8">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-purple-600" />
                  </div>
                  <p className="text-gray-600 font-medium">Image not found: /image.png</p>
                  <p className="text-gray-400 text-sm mt-2">Please ensure image.png is in the public folder.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
            <p className="text-gray-600 leading-relaxed">
              The Complaints module provides a specialized environment for clinical documentation and treatment planning. This section details the advanced features available within the Consultation interface.
            
            <p className="text-red-500 leading-relaxed mt-5 font-bold">
             * Before filling out the complaint, we need to complete the report first.
            </p>
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Complaints & Progress Notes */}
              <div className="p-5 rounded-xl border border-purple-100 bg-purple-50/30">
                <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Clinical Documentation
                </h4>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-sm text-gray-700">
                    <span className="text-purple-600 font-bold">•</span>
                    <div><strong>Complaints Recording:</strong> Structured input fields to capture patient symptoms and primary concerns.</div>
                  </li>
                  <li className="flex gap-3 text-sm text-gray-700">
                    <span className="text-purple-600 font-bold">•</span>
                    <div><strong>Progress Notes:</strong> Longitudinal tracking of treatment effectiveness and patient recovery.</div>
                  </li>
                  <li className="flex gap-3 text-sm text-gray-700">
                    <span className="text-purple-600 font-bold">•</span>
                    <div><strong>Previous Complaints:</strong> Instant access to chronological history of all past clinical visits and notes.</div>
                  </li>
                </ul>
              </div>

              {/* Treatment & Services */}
              <div className="p-5 rounded-xl border border-indigo-100 bg-indigo-50/30">
                <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Treatments & Packages
                </h4>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-sm text-gray-700">
                    <span className="text-indigo-600 font-bold">•</span>
                    <div><strong>Add Treatment Packages:</strong> Quick-select pre-configured bundles of services and medications.</div>
                  </li>
                  <li className="flex gap-3 text-sm text-gray-700">
                    <span className="text-indigo-600 font-bold">•</span>
                    <div><strong>Service Selection:</strong> Link specific clinical procedures performed during the session.</div>
                  </li>
                  <li className="flex gap-3 text-sm text-gray-700">
                    <span className="text-indigo-600 font-bold">•</span>
                    <div><strong>Resource Linkage:</strong> Automatically sync used consumables with stock management.</div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Prescriptions & Extras */}
            <div className="p-6 rounded-xl border border-blue-100 bg-white shadow-sm">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Pill className="w-5 h-5 text-blue-600" /> Prescriptions & Follow-ups
              </h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                    <p className="text-sm text-gray-700"><strong>Digital Prescriptions:</strong> Generate and send prescriptions with dosage and duration.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                    <p className="text-sm text-gray-700"><strong>Consent Forms:</strong> Send required medical consent forms directly to the patient's device. <Send className="inline w-3 h-3 text-blue-500" /></p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                    <p className="text-sm text-gray-700"><strong>Next Session Booking:</strong> Schedule follow-up visits immediately while documenting current notes. <CalendarCheck className="inline w-3 h-3 text-purple-500" /></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                    <p className="text-sm text-gray-700"><strong>Smart Recommendations:</strong> AI-driven suggestions based on patient symptoms and historical data. <Lightbulb className="inline w-3 h-3 text-yellow-500" /></p>
                  </div>
                </div>
              </div>
            </div>
<div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header Section */}
        
        {/* UI Preview Section */}
       

        {/* Detailed Explanation Section */}
        <div className="p-8 space-y-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Info className="w-6 h-6 text-purple-600" />
            Understanding the Complaints Module
          </h2>

          {/* Section 1: Overview of the Module */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-indigo-600" />
              1. Core Sections: Complaints, Progress Notes & Prescriptions
            </h3>
            <p className="text-gray-600 leading-relaxed">
              The Complaints module is a central hub for documenting patient interactions, medical progress, and treatment plans. It's divided into three key areas:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-600">
              <li><strong>Complaints:</strong> Record the patient's primary concerns and symptoms.</li>
              <li><strong>Progress Notes:</strong> Document observations, assessments, and treatment progress over time.</li>
              <li><strong>Prescriptions:</strong> Manage and issue medication prescriptions.</li>
            </ul>
          </div>

          {/* Section 2: Key Functionalities */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              {/* <ClipboardList className="w-5 h-5 text-blue-600" /> */}
              2. Key Functionalities
            </h3>
            <p className="text-gray-600 leading-relaxed">
              This module offers a range of tools to streamline the consultation and documentation process:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-600">
              <li><strong>Add Treatment Packages:</strong> Easily link and apply pre-defined treatment packages to a patient's visit. <Package className="inline w-4 h-4" /></li>
              <li><strong>Record Complaints:</strong> A dedicated text area to meticulously record patient complaints and medical history.</li>
              <li><strong>Upload Before/After Images:</strong> Document visual progress or conditions by uploading relevant images. <ImageIcon className="inline w-4 h-4" /></li>
              <li><strong>Send Consent Forms:</strong> Generate and send digital consent forms directly to patients for signature. <Send className="inline w-4 h-4" /></li>
              <li><strong>Book Next Session:</strong> Seamlessly schedule follow-up appointments directly from the complaints interface. <CalendarCheck className="inline w-4 h-4" /></li>
              <li><strong>Smart Recommendations:</strong> AI-powered suggestions for diagnoses, treatments, or prescriptions based on recorded data. <Lightbulb className="inline w-4 h-4" /></li>
              <li><strong>Appointments:</strong> Quick access to the patient's appointment history and future bookings. <BookOpen className="inline w-4 h-4" /></li>
              <li><strong>View Previous Complaints:</strong> Access a chronological history of all past complaints and progress notes for the patient. <History className="inline w-4 h-4" /></li>
            </ul>
          </div>

          {/* Section 3: Prescriptions Management */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <Pill className="w-5 h-5 text-green-600" />
              3. Prescriptions Management
            </h3>
            <p className="text-gray-600 leading-relaxed">
              The prescription section allows for efficient and accurate medication management:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-600">
              <li><strong>Add Medications:</strong> Search and add medications from a pre-defined formulary.</li>
              <li><strong>Dosage & Instructions:</strong> Specify dosage, frequency, and special instructions.</li>
              <li><strong>Print/Send Prescriptions:</strong> Generate printable prescriptions or send them digitally to pharmacies.</li>
              <li><strong>Drug Interaction Alerts:</strong> System alerts for potential drug-drug interactions or allergies.</li>
            </ul>
          </div>

          {/* Section 4: System Behaviors & Syncing */}
          <div className="space-y-4 bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h3 className="text-xl font-semibold text-blue-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              4. System Behaviors & Data Syncing
            </h3>
            <p className="text-blue-900 leading-relaxed">
              The Complaints module is deeply integrated with other parts of the clinic management system, ensuring seamless data flow and consistency:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-blue-900">
              <li><strong>EMR Integration:</strong> All complaints, progress notes, and prescriptions are automatically saved to the patient's Electronic Medical Record (EMR).</li>
              <li><strong>Appointment Linkage:</strong> Each complaint entry is linked to a specific appointment, providing a clear historical context.</li>
              <li><strong>Inventory Management:</strong> Prescribed medications or used stock items can be automatically deducted from inventory.</li>
              <li><strong>Billing Integration:</strong> Treatment packages and services recorded here can be automatically reflected in the patient's invoice.</li>
              <li><strong>Audit Trail:</strong> All modifications and additions are logged, maintaining a comprehensive audit trail for compliance.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
           
            {/* Prescriptions & Extras - Billing Integration Section */}
            <div className="w-full mt-8 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-green-600" />
                Prescriptions & Extras - Billing Integration
              </h2>

              {/* Billing Dashboard Overview - Three Cards + Screenshot */}
              <div className="w-full bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6 mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                 
                  Billing Dashboard Overview
                </h3>
                
                {/* First Row: Three Small Cards */}
              
                <h5 className="text-xl font-bold text-blue-800 mb-6 flex items-center gap-2">
                  On the Scheduled Appointments page, when you click on the three-dot (⋮) actions menu, options like Appointment, Report, Billing and Edit forms are available.
                </h5>
                {/* Three Full-Size Image Sections */}
                <div className="space-y-4 mb-6">
                  {/* Image 1 - App Interface */}
                  <div className="aspect-video bg-white rounded-xl border-2 border-blue-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-lg">
                    <img 
                      src="/app.png" 
                      alt="App Interface" 
                      className="w-full h-full object-contain p-4"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement?.querySelector('.placeholder-content-app')?.classList.remove('hidden');
                      }}
                    />
                    <div className="placeholder-content-app hidden text-center p-8">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-gray-600 font-medium">Image not found: /app.png</p>
                      <p className="text-gray-400 text-sm mt-2">Please ensure app.png is in the public folder</p>
                    </div>
                  </div>

                  {/* Image 2 - Report Section */}
                  <div className="aspect-video bg-white rounded-xl border-2 border-purple-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-lg">
                    <img 
                      src="/report.png" 
                      alt="Report Section" 
                      className="w-full h-full object-contain p-4"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement?.querySelector('.placeholder-content-report')?.classList.remove('hidden');
                      }}
                    />
                    <div className="placeholder-content-report hidden text-center p-8">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="w-8 h-8 text-purple-600" />
                      </div>
                      <p className="text-gray-600 font-medium">Image not found: /report.png</p>
                      <p className="text-gray-400 text-sm mt-2">Please ensure report.png is in the public folder</p>
                    </div>
                  </div>

                  {/* Image 3 - Edit Billing */}
                  <div className="aspect-video bg-white rounded-xl border-2 border-green-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-lg">
                    <img 
                      src="/edit.png" 
                      alt="Edit Billing" 
                      className="w-full h-full object-contain p-4"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement?.querySelector('.placeholder-content-edit')?.classList.remove('hidden');
                      }}
                    />
                    <div className="placeholder-content-edit hidden text-center p-8">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="text-gray-600 font-medium">Image not found: /edit.png</p>
                      <p className="text-gray-400 text-sm mt-2">Please ensure edit.png is in the public folder</p>
                    </div>
                  </div>
                </div>
 
                {/* Large Billing Screenshot Area */}
                <div className="aspect-video bg-white rounded-xl border-2 border-green-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-lg">
                  <img 
                    src="/billing.png?v=1" 
                    alt="Billing Overview" 
                    className="w-full h-full object-contain p-4"
                    onError={(e) => {
                      console.log('❌ Image failed to load:', (e.target as HTMLImageElement).src);
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement?.querySelector('.placeholder-content-billing')?.classList.remove('hidden');
                    }}
                    onLoad={() => console.log('✅ Image loaded successfully!')}
                  />
                  <div className="placeholder-content-billing hidden text-center p-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Wallet className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-gray-600 font-medium">Image not found: /billing.png</p>
                    <p className="text-gray-400 text-sm mt-2">Please ensure billing.png is in the public folder</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing Cards - Moved Above Smart Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Card 1: Billing Summary */}
                  <div className="bg-white border-2 mt-7 border-green-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-bold text-green-900">Billing Summary</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Total amount due and paid status</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Real-time calculation of services</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Pending balance tracking</span>
                      </li>
                    </ul>
                  </div>

                  {/* Card 2: Quick Actions */}
                  <div className="bg-white border-2 border-blue-200 mt-7 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-bold text-blue-900">Quick Actions</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>Add treatment packages instantly</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>Process multiple payment methods</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>Split payments (Cash + Card)</span>
                      </li>
                    </ul>
                  </div>

                  {/* Card 3: Payment History */}
                  <div className="bg-white border-2 border-purple-200 mt-7 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                        <Receipt className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-bold text-purple-900">Payment History</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span>Complete transaction logs</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span>Communication tracking</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span>Export and print receipts</span>
                      </li>
                    </ul>
                  </div>
                </div>

              {/* Billing Features Explanation */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Smart Recommendations */}
                <div className="p-5 rounded-xl border border-purple-100 bg-purple-50/30">
                  <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    Smart Recommendations
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span>AI-powered service suggestions based on symptoms</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span>Historical pattern analysis for treatments</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span>Revenue optimization alerts</span>
                    </li>
                  </ul>
                </div>

                {/* Active Packages Visibility */}
                <div className="p-5 rounded-xl border border-teal-100 bg-teal-50/30">
                  <h4 className="font-bold text-teal-900 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-teal-600" />
                    Active Packages Visibility
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                      <span>View patient's active wellness plans</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                      <span>Track sessions utilized vs. remaining</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                      <span>Auto-apply package benefits to billing</span>
                    </li>
                  </ul>
                </div>
                {/* Multi-Payment Support */}
                <div className="p-5 rounded-xl border border-blue-100 bg-blue-50/30">
                  <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    Multi-Payment & Split Payments
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Cash + Card + UPI + Insurance support</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Split payments across multiple methods</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Auto-calculate remaining balance</span>
                    </li>
                  </ul>
                </div>

                {/* Communication Logs */}
                <div className="p-5 rounded-xl border border-orange-100 bg-orange-50/30">
                  <h4 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-600" />
                    Communication & Receipts
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span>Auto SMS/email payment confirmations</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span>Send payment reminders via WhatsApp</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span>Print/download detailed receipts</span>
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

export default ScheduledAppointmentsWorkflowGuide;
