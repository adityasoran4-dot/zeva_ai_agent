"use client";
import React from 'react';
import { FileText, Plus, Eye } from 'lucide-react';

const ConsentFormGuide: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header Section */}
      <div className="flex items-center gap-3 mb-8">
        <FileText className="w-10 h-10 text-teal-600" />
        <h2 className="text-3xl font-bold text-gray-900">Consent Forms - Workflow Guide</h2>
      </div>
      
      <div className="prose max-w-none space-y-8">
        {/* Overview Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-6 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-teal-600" />
              Overview
            </h3>
          </div>
          
          <div className="p-6">
            {/* Image Placeholder */}
            <div className="bg-teal-50 rounded-xl border border-teal-200 p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Main Consent Forms Screen
              </h3>
              <div className="bg-white rounded-lg border-2 border-teal-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                <img 
                  src="/consentform.png" 
                  alt="Consent Forms Overview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.querySelector('.placeholder-consent')?.classList.remove('hidden');
                  }}
                />
                <div className="placeholder-consent hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 text-gray-500">
                  <FileText className="w-16 h-16 mb-4 text-teal-300" />
                  <p className="text-lg font-medium">Consent Forms Overview</p>
                  <p className="text-sm mt-2">Screenshot will appear here</p>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-4">
              <p className="text-base text-gray-700 leading-relaxed">
                The Consent Forms module enables clinics to create, manage, and track patient consent forms 
                for various medical procedures and treatments. This essential feature ensures legal compliance 
                and proper documentation of patient agreements before medical interventions.
              </p>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Key Features:</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span><strong>Digital Form Management:</strong> Upload and organize consent forms in multiple formats (PDF, DOC, DOCX)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span><strong>Service Mapping:</strong> Link consent forms to specific medical services and treatments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span><strong>Digital Signatures:</strong> Enable electronic signature capture with name confirmation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span><strong>Multi-Language Support:</strong> Create forms in English, Spanish, French, Arabic, and Hindi</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span><strong>Version Control:</strong> Track form versions and maintain update history</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span><strong>Department Organization:</strong> Categorize forms by clinical departments</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Create Consent Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Plus className="w-6 h-6 text-green-600" />
              Create Consent Form
            </h3>
          </div>
          
          <div className="p-6">
            {/* Image Placeholder */}
            <div className="bg-green-50 rounded-xl border border-green-200 p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Create Consent Form Interface
              </h3>
              <div className="bg-white rounded-lg border-2 border-green-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                <img 
                  src="/upload.png" 
                  alt="Create Consent Form" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.querySelector('.placeholder-create')?.classList.remove('hidden');
                  }}
                />
                <div className="placeholder-create hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 text-gray-500">
                  <Plus className="w-16 h-16 mb-4 text-green-300" />
                  <p className="text-lg font-medium">Create Consent Form</p>
                  <p className="text-sm mt-2">Screenshot will appear here</p>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-4">
              <p className="text-base text-gray-700 leading-relaxed">
                Creating a new consent form is a straightforward process that guides you through uploading 
                the document, configuring details, mapping services, and setting up signature options.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                <h4 className="font-semibold text-green-900 mb-3">Steps to Create a Consent Form:</h4>
                <ol className="space-y-3 text-sm text-green-800">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <div>
                      <strong>Upload Document:</strong> Click "Create New Form" and upload your consent form file (PDF, DOC, or DOCX format). Drag and drop or browse to select the file.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <div>
                      <strong>Enter Form Details:</strong> Provide a clear form name, select the department, choose language, set version number, and add an optional description.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <div>
                      <strong>Map to Services:</strong> Search and select the medical services or treatments that require this consent form. Multiple services can be linked to one form.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                    <div>
                      <strong>Configure Signature Settings:</strong> Enable digital signatures, name confirmation, witness signatures, and other signature options based on your requirements.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                    <div>
                      <strong>Review & Publish:</strong> Verify all information, make any necessary adjustments, and click "Publish" to activate the consent form for use.
                    </div>
                  </li>
                </ol>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Ensure all required fields are completed before publishing. Forms can be edited or updated after creation, and new versions can be created while preserving history.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* View Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Eye className="w-6 h-6 text-purple-600" />
              View & Manage Consent Forms
            </h3>
          </div>
          
          <div className="p-6">
            {/* Image Placeholder */}
            <div className="bg-purple-50 rounded-xl border border-purple-200 p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Consent Forms List View
              </h3>
              <div className="bg-white rounded-lg border-2 border-purple-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                <img 
                  src="/view.png" 
                  alt="Consent Forms List" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.querySelector('.placeholder-view')?.classList.remove('hidden');
                  }}
                />
                <div className="placeholder-view hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 text-gray-500">
                  <Eye className="w-16 h-16 mb-4 text-purple-300" />
                  <p className="text-lg font-medium">Consent Forms List View</p>
                  <p className="text-sm mt-2">Screenshot will appear here</p>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-4">
              <p className="text-base text-gray-700 leading-relaxed">
                The consent forms list view provides a comprehensive overview of all consent forms in your clinic. 
                You can easily search, filter, view details, and manage existing forms from this centralized dashboard.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Viewing Information
                  </h4>
                  <ul className="space-y-2 text-sm text-purple-800">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-0.5">•</span>
                      <span><strong>Form Name:</strong> Identifies the consent form</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-0.5">•</span>
                      <span><strong>Department:</strong> Associated clinical department</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-0.5">•</span>
                      <span><strong>Language:</strong> Available language(s)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-0.5">•</span>
                      <span><strong>Version:</strong> Current version number</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-0.5">•</span>
                      <span><strong>Status:</strong> Active or inactive status</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-0.5">•</span>
                      <span><strong>Linked Services:</strong> Associated treatments</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Management Actions
                  </h4>
                  <ul className="space-y-2 text-sm text-indigo-800">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 mt-0.5">•</span>
                      <span><strong>Edit:</strong> Update form details and settings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 mt-0.5">•</span>
                      <span><strong>View Details:</strong> See complete form information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 mt-0.5">•</span>
                      <span><strong>Activate/Deactivate:</strong> Toggle form availability</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 mt-0.5">•</span>
                      <span><strong>Create Version:</strong> Generate new form versions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 mt-0.5">•</span>
                      <span><strong>Delete:</strong> Remove obsolete forms</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 mt-0.5">•</span>
                      <span><strong>Download:</strong> Export form documents</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Search & Filter Options:</h4>
                <p className="text-sm text-blue-800">
                  Use the search bar to find forms by name, and apply filters to narrow results by department, 
                  language, status, or date range. This helps you quickly locate specific consent forms in your library.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentFormGuide;
