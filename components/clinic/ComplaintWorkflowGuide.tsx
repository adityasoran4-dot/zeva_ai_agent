"use client";
import React from 'react';
import { 
  ClipboardList, 
  Image as ImageIcon, 
  CalendarCheck, 
  MessageSquare, 
  History, 
  Info, 
  CheckCircle, 
  Layout, 
  MousePointer2, 
  Pill, 
  Package, 
  Send, 
  BookOpen, 
  Lightbulb, 
  Stethoscope
} from 'lucide-react';

const ComplaintWorkflowGuide: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white">
          <div className="flex items-center gap-4 mb-2">
            <MessageSquare className="w-12 h-12" />
            <div>
              <h1 className="text-3xl font-bold">Complaints Module Workflow Guide</h1>
              <p className="text-purple-100 text-sm opacity-90">Detailed guide for managing patient complaints, progress notes, and prescriptions.</p>
            </div>
          </div>
        </div>

        {/* UI Preview Section */}
        <div className="p-8 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MousePointer2 className="w-6 h-6 text-purple-600" />
            Complaints Interface Overview
          </h2>
          <div className="aspect-video bg-gray-100 rounded-lg border-2 border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group">
            <img 
              src="/complaint_module_screenshot.png" // Placeholder for the actual image
              alt="Complaints Module UI" 
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement?.querySelector('.placeholder-content')?.classList.remove('hidden');
              }}
            />
            <div className="placeholder-content hidden text-center p-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layout className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-gray-600 font-medium">Image not found: /complaint_module_screenshot.png</p>
              <p className="text-gray-400 text-sm mt-2">Please ensure complaint_module_screenshot.png is in the public folder.</p>
            </div>
          </div>
        </div>

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
              <ClipboardList className="w-5 h-5 text-blue-600" />
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
  );
};

export default ComplaintWorkflowGuide;
