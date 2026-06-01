"use client";
import React from 'react';
import { Shield, AlertTriangle, BookOpen, CheckCircle, Users, Lock, Trash2, Heart, ClipboardCheck, FolderOpen, PlayCircle, UserCheck, Tag, FileText, Plus } from 'lucide-react';

const PolicyComplianceGuide: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Policy & Compliance Guide</h1>
            <p className="text-gray-600 mt-1">Essential policies, regulations, and compliance requirements for healthcare facilities</p>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            What is Policy & Compliance in Healthcare?
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            Policy and compliance in healthcare refers to the systematic framework of rules, regulations, guidelines, 
            and best practices that ensure your clinic operates legally, ethically, and safely. This includes patient 
            privacy protection, staff credentialing, infection control, medical waste management, emergency preparedness, 
            and maintaining proper documentation. Compliance is not optional—it's a legal and ethical requirement that 
            protects patients, staff, and your practice from liability.
          </p>

          {/* Image Section */}
          <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-300 p-8 my-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                Policy & Compliance Management - Complete Framework
              </h3>
            </div>
            <div className="bg-white rounded-xl border-2 border-blue-200 overflow-hidden shadow-inner relative group" style={{ minHeight: '550px', maxHeight: '650px' }}>
              <img 
                src="/policy.png" 
                alt="Policy and Compliance Management Interface" 
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-policy')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-policy hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 text-gray-500">
                <Shield className="w-20 h-20 mb-4 text-blue-400" />
                <p className="text-xl font-semibold text-blue-700">Policy & Compliance Management</p>
                <p className="text-sm mt-2 text-blue-600">Screenshot will appear here when available</p>
                <div className="mt-4 px-4 py-2 bg-blue-200 rounded-lg text-xs text-blue-800">
                  Expected: /policy.png
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Why Compliance Matters:</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li><strong>Legal Protection:</strong> Avoid fines, penalties, and legal action from regulatory bodies</li>
              <li><strong>Patient Safety:</strong> Ensure highest standards of care and safety protocols</li>
              <li><strong>Data Security:</strong> Protect sensitive patient information from breaches</li>
              <li><strong>Quality Assurance:</strong> Maintain consistent, high-quality healthcare delivery</li>
              <li><strong>Insurance Requirements:</strong> Meet malpractice and liability insurance conditions</li>
              <li><strong>Accreditation:</strong> Qualify for healthcare certifications and accreditations</li>
              <li><strong>Reputation Management:</strong> Build trust with patients and community</li>
              <li><strong>Staff Accountability:</strong> Clear guidelines for professional conduct</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Key Compliance Areas */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-purple-600" />
            Key Compliance Areas
          </h2>
        </div>
        
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Patient Privacy & Data Protection */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Patient Privacy & Data Protection</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span><strong>HIPAA Compliance:</strong> Protect all patient health information (PHI)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Access Controls:</strong> Role-based permissions for patient records</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Encryption:</strong> Secure data at rest and in transit</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Consent Management:</strong> Obtain and document patient consent</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Breach Notification:</strong> Report data breaches within required timeframes</span>
                </li>
              </ul>
            </div>

            {/* Staff Credentialing & Licensing */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-green-600 rounded-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Staff Credentialing & Licensing</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>License Verification:</strong> Validate all medical licenses are current</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Certification Tracking:</strong> Monitor BLS, ACLS, and specialty certs</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Background Checks:</strong> Criminal history and reference verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Continuing Education:</strong> Track CME/CEU requirements</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Privileging:</strong> Define scope of practice for each provider</span>
                </li>
              </ul>
            </div>

            {/* Infection Control */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-red-600 rounded-lg">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Infection Control & Safety</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Hand Hygiene:</strong> WHO 5 moments protocol compliance</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span><strong>PPE Usage:</strong> Proper personal protective equipment protocols</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Sterilization:</strong> Equipment sterilization and disinfection standards</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Isolation Procedures:</strong> Patient isolation for contagious conditions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Outbreak Management:</strong> Response protocols for infection outbreaks</span>
                </li>
              </ul>
            </div>

            {/* Medical Waste Management */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-yellow-600 rounded-lg">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Medical Waste Management</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Segregation:</strong> Separate biohazard, sharps, pharmaceutical waste</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Labeling:</strong> Proper labeling of all waste containers</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Storage:</strong> Safe temporary storage before disposal</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Disposal:</strong> Licensed medical waste disposal contractors only</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Documentation:</strong> Maintain waste tracking manifests</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Preparedness */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            Emergency Preparedness & Response
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            Every healthcare facility must have comprehensive emergency plans covering various scenarios. 
            These protocols ensure patient safety, staff coordination, and business continuity during crises.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
              <h4 className="font-semibold text-orange-900 mb-2">🔥 Fire Emergency</h4>
              <ul className="space-y-1 text-xs text-orange-800">
                <li>• RACE protocol (Rescue, Alarm, Contain, Extinguish)</li>
                <li>• Evacuation routes and assembly points</li>
                <li>• Fire extinguisher locations and training</li>
                <li>• Emergency contact numbers posted</li>
              </ul>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <h4 className="font-semibold text-blue-900 mb-2">🌊 Natural Disasters</h4>
              <ul className="space-y-1 text-xs text-blue-800">
                <li>• Earthquake, flood, hurricane protocols</li>
                <li>• Backup power generator testing</li>
                <li>• Emergency supply stockpiles</li>
                <li>• Patient evacuation procedures</li>
              </ul>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <h4 className="font-semibold text-red-900 mb-2">🚨 Medical Emergencies</h4>
              <ul className="space-y-1 text-xs text-red-800">
                <li>• Code Blue response team</li>
                <li>• Crash cart locations and checks</li>
                <li>• Emergency drug protocols</li>
                <li>• Ambulance coordination</li>
              </ul>
            </div>
          </div>

          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-red-900 mb-2">Emergency Kit Requirements:</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-red-800">
              <ul className="space-y-1">
                <li>✓ First aid supplies and trauma kits</li>
                <li>✓ Emergency medications (epinephrine, naloxone)</li>
                <li>✓ Flashlights and batteries</li>
                <li>✓ Emergency contact list</li>
              </ul>
              <ul className="space-y-1">
                <li>✓ Patient evacuation equipment</li>
                <li>✓ Communication devices (radios)</li>
                <li>✓ Personal protective equipment</li>
                <li>✓ Water and non-perishable food</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Documentation & Record Keeping */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-600" />
            Documentation & Record Keeping Standards
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            Proper documentation is critical for legal protection, continuity of care, and regulatory compliance. 
            All records must be accurate, complete, timely, and securely stored according to retention policies.
          </p>

          <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-teal-900 mb-3">Required Documentation:</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h5 className="font-semibold text-teal-800 text-sm">Patient Records:</h5>
                <ul className="space-y-1 text-xs text-teal-700">
                  <li>• Patient registration forms</li>
                  <li>• Medical history and physical exams</li>
                  <li>• Treatment plans and progress notes</li>
                  <li>• Informed consent forms</li>
                  <li>• Medication records and allergies</li>
                  <li>• Lab and imaging results</li>
                  <li>• Discharge summaries</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h5 className="font-semibold text-teal-800 text-sm">Administrative Records:</h5>
                <ul className="space-y-1 text-xs text-teal-700">
                  <li>• Staff credentials and licenses</li>
                  <li>• Incident reports</li>
                  <li>• Complaint logs and resolutions</li>
                  <li>• Equipment maintenance logs</li>
                  <li>• Infection control reports</li>
                  <li>• Waste disposal manifests</li>
                  <li>• Emergency drill documentation</li>
                </ul>
              </div>
            </div>
          </div>

          
        </div>
      </div>

      {/* Main Policy Topics Overview */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-violet-600" />
            Policy & Compliance Main Topics
          </h2>
          <p className="text-gray-600 mt-2 ml-8">Core modules available in the Policy & Compliance system</p>
        </div>
        
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* SOP Library Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FolderOpen className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">SOP Library</h3>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-700 mb-4">
                  Standard Operating Procedures - Complete collection with filtering, tracking, and management tools
                </p>
                <div className="bg-white rounded-lg border border-indigo-200 overflow-hidden mb-4">
                
                  <div className="placeholder-sop-lib hidden flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 text-gray-500 py-12">
                    <FolderOpen className="w-12 h-12 mb-2 text-indigo-400" />
                    <p className="text-sm font-medium text-indigo-700">SOP Library</p>
                    <p className="text-xs mt-1 text-indigo-600">/sop-library.png</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-indigo-700">
                    <CheckCircle className="w-3 h-3 text-indigo-600" />
                    <span>Filter by Department, Status, Risk Level</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-indigo-700">
                    <CheckCircle className="w-3 h-3 text-indigo-600" />
                    <span>Search & Sort Capabilities</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-indigo-700">
                    <CheckCircle className="w-3 h-3 text-indigo-600" />
                    <span>Version Control & Tracking</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Policy Center Card */}
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Policy Center</h3>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-700 mb-4">
                  Centralized policy management with version control and approval workflows
                </p>
                <div className="bg-white rounded-lg border border-cyan-200 overflow-hidden mb-4">
                 
                  <div className="placeholder-pol-center hidden flex flex-col items-center justify-center bg-gradient-to-br from-cyan-100 to-blue-100 text-gray-500 py-12">
                    <Shield className="w-12 h-12 mb-2 text-cyan-400" />
                    <p className="text-sm font-medium text-cyan-700">Policy Center</p>
                    <p className="text-xs mt-1 text-cyan-600">/policy-center.png</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-cyan-700">
                    <CheckCircle className="w-3 h-3 text-cyan-600" />
                    <span>Policy Lifecycle Management</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-cyan-700">
                    <CheckCircle className="w-3 h-3 text-cyan-600" />
                    <span>Approval Workflows</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-cyan-700">
                    <CheckCircle className="w-3 h-3 text-cyan-600" />
                    <span>Digital Signatures</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Process Playbooks Card */}
            <div className="bg-gradient-to-br from-green-50 to-teal-50 border-2 border-green-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-r from-green-500 to-teal-600 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <PlayCircle className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Process Playbooks</h3>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-700 mb-4">
                  Step-by-step interactive guides for complex procedures and workflows
                </p>
                <div className="bg-white rounded-lg border border-green-200 overflow-hidden mb-4">
                 
                  <div className="placeholder-playbooks hidden flex flex-col items-center justify-center bg-gradient-to-br from-green-100 to-teal-100 text-gray-500 py-12">
                    <PlayCircle className="w-12 h-12 mb-2 text-green-400" />
                    <p className="text-sm font-medium text-green-700">Process Playbooks</p>
                    <p className="text-xs mt-1 text-green-600">/process-playbooks.png</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-green-700">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>Interactive Step-by-Step Guides</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-green-700">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>Progress Tracking</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-green-700">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>Role-Based Assignments</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Acknowledgement Tracker Card */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Acknowledgement Tracker</h3>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-700 mb-4">
                  Monitor staff compliance with policy reviews and acknowledgements
                </p>
                <div className="bg-white rounded-lg border border-orange-200 overflow-hidden mb-4">
                  
                  <div className="placeholder-ack hidden flex flex-col items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100 text-gray-500 py-12">
                    <UserCheck className="w-12 h-12 mb-2 text-orange-400" />
                    <p className="text-sm font-medium text-orange-700">Acknowledgement Tracker</p>
                    <p className="text-xs mt-1 text-orange-600">/acknowledgement-tracker.png</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-orange-700">
                    <CheckCircle className="w-3 h-3 text-orange-600" />
                    <span>Compliance Monitoring</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-orange-700">
                    <CheckCircle className="w-3 h-3 text-orange-600" />
                    <span>Automated Reminders</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-orange-700">
                    <CheckCircle className="w-3 h-3 text-orange-600" />
                    <span>Audit Trail Records</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Add SOP Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Add New SOP</h3>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-700 mb-4">
                  Step-by-step guide to creating and publishing new Standard Operating Procedures
                </p>
                <div className="bg-white rounded-lg border border-emerald-200 overflow-hidden mb-4">
                 
                  <div className="placeholder-add-sop hidden flex flex-col items-center justify-center bg-gradient-to-br from-emerald-100 to-green-100 text-gray-500 py-12">
                    <Plus className="w-12 h-12 mb-2 text-emerald-400" />
                    <p className="text-sm font-medium text-emerald-700">Add New SOP</p>
                    <p className="text-xs mt-1 text-emerald-600">/add-sop.png</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-emerald-700">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span>SOP Creation Workflow</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-emerald-700">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span>Approval Chain Setup</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-emerald-700">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span>Version Management</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SOP Categories Card */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Tag className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">SOP Categories</h3>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-700 mb-4">
                  Organizing Your Procedures - Structured classification system for easy SOP management
                </p>
                <div className="bg-white rounded-lg border border-violet-200 overflow-hidden mb-4">
                  
                  <div className="placeholder-categories hidden flex flex-col items-center justify-center bg-gradient-to-br from-violet-100 to-purple-100 text-gray-500 py-12">
                    <Tag className="w-12 h-12 mb-2 text-violet-400" />
                    <p className="text-sm font-medium text-violet-700">SOP Categories</p>
                    <p className="text-xs mt-1 text-violet-600">/sop-categories.png</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-violet-700">
                    <CheckCircle className="w-3 h-3 text-violet-600" />
                    <span>6 Main Category Groups</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-violet-700">
                    <CheckCircle className="w-3 h-3 text-violet-600" />
                    <span>Multi-Tag Support</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-violet-700">
                    <CheckCircle className="w-3 h-3 text-violet-600" />
                    <span>Hierarchical Structure</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Checklist */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-green-600" />
            Monthly Compliance Checklist
          </h2>
        </div>
        
        <div className="p-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-5">
            <h4 className="font-semibold text-green-900 mb-4">Regular Compliance Tasks:</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h5 className="font-semibold text-green-800 text-sm border-b border-green-200 pb-2">Daily Tasks:</h5>
                <ul className="space-y-2 text-sm text-green-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Verify hand hygiene compliance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Check emergency equipment accessibility</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Review patient consent forms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Document all incidents immediately</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h5 className="font-semibold text-green-800 text-sm border-b border-green-200 pb-2">Weekly Tasks:</h5>
                <ul className="space-y-2 text-sm text-green-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Inspect crash cart and emergency drugs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Review infection control reports</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Check medical waste disposal logs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Verify staff PPE availability</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h5 className="font-semibold text-green-800 text-sm border-b border-green-200 pb-2">Monthly Tasks:</h5>
                <ul className="space-y-2 text-sm text-green-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Test backup power generator</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Review staff license expiration dates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Conduct fire safety inspection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Update emergency contact lists</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h5 className="font-semibold text-green-800 text-sm border-b border-green-200 pb-2">Quarterly Tasks:</h5>
                <ul className="space-y-2 text-sm text-green-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Conduct emergency evacuation drill</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Review and update all policies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Staff compliance training sessions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Audit patient record completeness</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Important Reminder
            </h4>
            <p className="text-sm text-amber-800">
              Compliance is an ongoing responsibility. Regular audits, staff training, and policy updates are essential 
              to maintaining a safe, legal, and ethical healthcare environment. Document all compliance activities and 
              keep records readily available for inspections and accreditation reviews.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyComplianceGuide;
