"use client";
import React, { useState } from 'react';
import { Users, UserPlus, Eye, Shield } from 'lucide-react';

const ClinicManagementGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Users className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Clinic Management - Complete Guide
              </h1>
              <p className="text-blue-100 text-sm">
                Comprehensive guide for managing clinic staff, doctors, agents,
                and user administration
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-blue-100 text-xs mb-1">User Management</p>
              <p className="text-white font-semibold">
                View, Create, Edit, Delete
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-blue-100 text-xs mb-1">Access Control</p>
              <p className="text-white font-semibold">Rights & Permissions</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-blue-100 text-xs mb-1">Security</p>
              <p className="text-white font-semibold">Password Management</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-blue-100 text-xs mb-1">Profile Management</p>
              <p className="text-white font-semibold">Complete User Profiles</p>
            </div>
          </div>
        </div>

        {/* Quick Navigation Tabs */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Quick Navigation - Complete Details of All Sections
          </h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { id: "overview", label: "Overview", icon: Users },
              { id: "create-user", label: "Create New Agent/Doctor", icon: UserPlus },
              { id: "view-profile", label: "View Staff Profile", icon: Eye },
              { id: "profile-details", label: "Profile Management", icon: Users },
              { id: "permissions", label: "Rights & Permissions", icon: Shield },
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  activeSection === section.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <section.icon className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">{section.label}</span>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-semibold mb-2">
              🎯 Key Points:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1 text-xs text-blue-700">
              <li><strong>Team Statistics:</strong> View Total Team, Approved, Pending, and Declined counts at a glance</li>
              <li><strong>Create Users:</strong> Add new agents or doctors with complete profile setup</li>
              <li><strong>Staff Monitoring:</strong> Track login times, online/offline status, and activity</li>
              <li><strong>Profile Management:</strong> Update details, contact info, and documents</li>
              <li><strong>Access Control:</strong> Toggle permissions to control dashboard feature access</li>
            </ul>
          </div>
        </div>

        {/* Overview Section */}
        {activeSection === "overview" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-8 mb-10 rounded-r-lg">
              <h4 className="font-bold text-lg text-blue-900 mb-5 flex items-center gap-2">
                <span className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full text-base font-bold">1</span>
                Clinic Management - Dashboard Overview
              </h4>
              <div className="ml-12 space-y-4">
                <p className="text-base text-blue-800 leading-relaxed">
                  The Clinic Management dashboard provides a comprehensive overview of your entire team,
                  including agents, doctors, and staff members. Monitor key statistics and manage user
                  accounts efficiently from this central hub.
                </p>
                <ul className="list-disc list-inside space-y-3 text-base text-blue-700">
                  <li><strong>Total Team:</strong> Complete count of all registered users (agents, doctors, staff)</li>
                  <li><strong>Approved Users:</strong> Active team members with verified accounts</li>
                  <li><strong>Pending Approvals:</strong> New registrations awaiting admin approval</li>
                  <li><strong>Declined Applications:</strong> Rejected or deactivated user accounts</li>
                  <li><strong>Quick Actions:</strong> Create new agent or doctor accounts instantly</li>
                  <li><strong>Status Indicators:</strong> Color-coded badges for easy identification</li>
                  <li><strong>Search & Filter:</strong> Find specific team members quickly</li>
                </ul>
                
                {/* Image Section - Overview */}
                <div className="w-full bg-blue-50 rounded-xl border border-blue-200 p-6 mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Clinic Management Dashboard Overview
                  </h3>
                  <div className="bg-white rounded-lg border-2 border-blue-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                    <img 
                      src="/clinic.png" 
                      alt="Clinic Management Overview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement?.querySelector('.placeholder-overview')?.classList.remove('hidden');
                      }}
                    />
                    <div className="placeholder-overview hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-500">
                      <Users className="w-16 h-16 mb-4 text-blue-300" />
                      <p className="text-lg font-medium">Clinic Management Overview</p>
                      <p className="text-sm mt-2">Screenshot will appear here</p>
                    </div>
                  </div>
                </div>
                
                
              </div>
            </div>
          </div>
        )}

        {/* Create New Agent/Doctor Section */}
        {activeSection === "create-user" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-8 mb-10 rounded-r-lg">
              <h4 className="font-bold text-lg text-green-900 mb-5 flex items-center gap-2">
                <span className="flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-full text-base font-bold">2</span>
                Create New Agent or Doctor
              </h4>
              <div className="ml-12 space-y-4">
                <p className="text-base text-green-800 leading-relaxed">
                  The Create User feature allows you to add new team members to your clinic. You can create
                  accounts for agents (marketing/sales team) or doctors (medical practitioners) with complete
                  profile information and role-based permissions.
                </p>
                <ul className="list-disc list-inside space-y-3 text-base text-green-700">
                  <li><strong>Select User Type:</strong> Choose between Agent or Doctor role</li>
                  <li><strong>Basic Information:</strong> Enter full name, email, phone number</li>
                  <li><strong>Professional Details:</strong> Add qualifications, specialization, experience (for doctors)</li>
                  <li><strong>Department Assignment:</strong> Assign to specific department or team</li>
                  <li><strong>Initial Password:</strong> Set temporary password for first login</li>
                  <li><strong>Profile Photo:</strong> Upload professional profile picture</li>
                  <li><strong>Document Upload:</strong> Attach certificates, licenses, ID proofs</li>
                  <li><strong>Status Setting:</strong> Mark as Active, Pending, or Inactive</li>
                </ul>
                
                {/* Image Section - Create User */}
                <div className="w-full bg-green-50 rounded-xl border border-green-200 p-6 mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Create New Agent/Doctor Form
                  </h3>
                  <div className="bg-white rounded-lg border-2 border-green-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                    <img 
                      src="/doctor.png" 
                      alt="Create New User" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement?.querySelector('.placeholder-create')?.classList.remove('hidden');
                      }}
                    />
                    <div className="placeholder-create hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 text-gray-500">
                      <UserPlus className="w-16 h-16 mb-4 text-green-300" />
                      <p className="text-lg font-medium">Create New User Form</p>
                      <p className="text-sm mt-2">Screenshot will appear here</p>
                    </div>
                  </div>
                </div>
                
               
              </div>
            </div>
          </div>
        )}

        {/* View Staff Profile Section */}
        {activeSection === "view-profile" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 border-l-4 border-purple-500 p-8 mb-10 rounded-r-lg">
              <h4 className="font-bold text-lg text-purple-900 mb-5 flex items-center gap-2">
                <span className="flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-full text-base font-bold">3</span>
                View Staff Profile - Complete Monitoring
              </h4>
              <div className="ml-12 space-y-4">
                <p className="text-base text-purple-800 leading-relaxed">
                  The View Profile section provides comprehensive monitoring of staff activity and status.
                  Track login times, online/offline status, contact updates, and all profile-related activities
                  in real-time.
                </p>
                <ul className="list-disc list-inside space-y-3 text-base text-purple-700">
                  <li><strong>Login Time Tracking:</strong> See exact date and time of last login</li>
                  <li><strong>Online/Offline Status:</strong> Real-time indicator showing if agent is currently active</li>
                  <li><strong>Basic Details Display:</strong> Name, email, phone, role, department at a glance</li>
                  <li><strong>Contact Updates:</strong> Track when contact information was last modified</li>
                  <li><strong>Profile Creation Activity:</strong> Timestamp of when account was created</li>
                  <li><strong>Document Upload History:</strong> View all uploaded certificates and files with dates</li>
                  <li><strong>Last Activity:</strong> Recent actions performed by the user</li>
                  <li><strong>Session Duration:</strong> How long user stayed logged in</li>
                </ul>
                
                {/* Image Section - View Profile */}
                <div className="w-full bg-purple-50 rounded-xl border border-purple-200 p-6 mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    View Staff Profile - Monitoring Dashboard
                  </h3>
                  <div className="bg-white rounded-lg border-2 border-purple-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                    <img 
                      src="/view.png" 
                      alt="View Staff Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement?.querySelector('.placeholder-view')?.classList.remove('hidden');
                      }}
                    />
                    <div className="placeholder-view hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-violet-50 text-gray-500">
                      <Eye className="w-16 h-16 mb-4 text-purple-300" />
                      <p className="text-lg font-medium">View Staff Profile</p>
                      <p className="text-sm mt-2">Screenshot will appear here</p>
                    </div>
                  </div>
                </div>
                
               
              </div>
            </div>
          </div>
        )}

        {/* Profile Management Section */}
        {activeSection === "profile-details" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 p-8 mb-10 rounded-r-lg">
              <h4 className="font-bold text-lg text-blue-900 mb-5 flex items-center gap-2">
                <span className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full text-base font-bold">4</span>
                Profile Management - Complete Information
              </h4>
              <div className="ml-12 space-y-4">
                <p className="text-base text-blue-800 leading-relaxed">
                  The Profile Management section displays all staff-related information in one place.
                  Update personal details, professional qualifications, contact information, and manage
                  account settings including password changes.
                </p>
                <ul className="list-disc list-inside space-y-3 text-base text-blue-700">
                  <li><strong>Personal Information:</strong> Full name, date of birth, gender, address</li>
                  <li><strong>Contact Details:</strong> Email, phone numbers, emergency contacts</li>
                  <li><strong>Professional Info:</strong> Qualifications, certifications, specializations, experience</li>
                  <li><strong>Employment Details:</strong> Joining date, department, designation, employment type</li>
                  <li><strong>Update Profile:</strong> Edit any field to keep information current</li>
                  <li><strong>Change Password:</strong> Securely update user password with validation</li>
                  <li><strong>Document Management:</strong> View, upload, or remove certificates and files</li>
                  <li><strong>Profile Photo:</strong> Update or change profile picture</li>
                  <li><strong>Account Status:</strong> Activate, deactivate, or suspend account</li>
                </ul>
                
                {/* Image Section - Profile Management */}
                <div className="w-full bg-blue-50 rounded-xl border border-blue-200 p-6 mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Profile Management Interface
                  </h3>
                  <div className="bg-white rounded-lg border-2 border-blue-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '700px', maxHeight: '900px' }}>
                    <img 
                      src="/profile1.png" 
                      alt="Profile Management" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement?.querySelector('.placeholder-profile')?.classList.remove('hidden');
                      }}
                    />
                    <div className="placeholder-profile hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 text-gray-500">
                      <Users className="w-16 h-16 mb-4 text-blue-300" />
                      <p className="text-lg font-medium">Profile Management</p>
                      <p className="text-sm mt-2">Screenshot will appear here</p>
                    </div>
                  </div>
                </div>
                
                
              </div>
            </div>
          </div>
        )}

        {/* Rights & Permissions Section */}
        {activeSection === "permissions" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 p-8 mb-10 rounded-r-lg">
              <h4 className="font-bold text-lg text-orange-900 mb-5 flex items-center gap-2">
                <span className="flex items-center justify-center w-10 h-10 bg-orange-600 text-white rounded-full text-base font-bold">5</span>
                Rights & Permissions - Access Control
              </h4>
              <div className="ml-12 space-y-4">
                <p className="text-base text-orange-800 leading-relaxed">
                  The Rights & Permissions section gives admins complete control over what each staff member
                  can access on their dashboard. Using simple toggle on/off controls, you can enable or restrict
                  access to different features based on the user's role and responsibilities.
                </p>
                <ul className="list-disc list-inside space-y-3 text-base text-orange-700">
                  <li><strong>Dashboard Modules:</strong> Control which modules appear on user's dashboard</li>
                  <li><strong>Patient Access:</strong> Enable/disable viewing, creating, or editing patient records</li>
                  <li><strong>Appointment Management:</strong> Grant or restrict appointment booking and scheduling rights</li>
                  <li><strong>Billing Access:</strong> Control access to invoices, payments, and financial data</li>
                  <li><strong>Reports Viewing:</strong> Allow or deny access to analytics and reports</li>
                  <li><strong>Marketing Tools:</strong> Enable/disable lead management and campaign features</li>
                  <li><strong>Settings Access:</strong> Restrict ability to modify clinic settings</li>
                  <li><strong>User Management:</strong> Control who can create or edit other user accounts</li>
                  <li><strong>Toggle Controls:</strong> Simple on/off switches for each permission</li>
                  <li><strong>Role-Based Templates:</strong> Pre-configured permission sets for common roles</li>
                  <li><strong>Custom Permissions:</strong> Create custom access levels for unique requirements</li>
                  <li><strong>Real-time Updates:</strong> Changes take effect immediately upon saving</li>
                </ul>
                
                <div className="bg-white rounded-lg border border-orange-200 p-4">
                  <h5 className="font-semibold text-orange-900 mb-3">🔐 Permission Categories Explained:</h5>
                  <div className="space-y-3">
                    <div className="bg-orange-50 rounded-lg p-3 border-l-4 border-orange-500">
                      <p className="font-semibold text-orange-900 mb-2 text-sm">For Doctors:</p>
                      <ul className="list-disc list-inside ml-4 space-y-1 text-xs text-orange-700">
                        <li>Access to patient records and medical history</li>
                        <li>Ability to create treatment plans and prescriptions</li>
                        <li>View appointment schedules and availability</li>
                        <li>Access to medical reports and diagnostics</li>
                        <li>Restricted from billing and financial data</li>
                      </ul>
                    </div>
                    
                    <div className="bg-orange-50 rounded-lg p-3 border-l-4 border-orange-500">
                      <p className="font-semibold text-orange-900 mb-2 text-sm">For Agents:</p>
                      <ul className="list-disc list-inside ml-4 space-y-1 text-xs text-orange-700">
                        <li>Access to lead management and CRM tools</li>
                        <li>View marketing campaigns and performance</li>
                        <li>Create and track referrals</li>
                        <li>Access to communication templates</li>
                        <li>Restricted from patient medical records</li>
                      </ul>
                    </div>
                    
                    <div className="bg-orange-50 rounded-lg p-3 border-l-4 border-orange-500">
                      <p className="font-semibold text-orange-900 mb-2 text-sm">For Receptionists:</p>
                      <ul className="list-disc list-inside ml-4 space-y-1 text-xs text-orange-700">
                        <li>Full appointment scheduling access</li>
                        <li>Patient registration and check-in</li>
                        <li>Basic billing and payment processing</li>
                        <li>Phone and email communication tools</li>
                        <li>Limited access to sensitive medical data</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* Image Section - Permissions */}
                <div className="w-full bg-orange-50 rounded-xl border border-orange-200 p-6 mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Rights & Permissions - Toggle Controls
                  </h3>
                  <div className="bg-white rounded-lg border-2 border-orange-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '700px', maxHeight: '900px' }}>
                    <img 
                      src="/manage1.png" 
                      alt="Rights and Permissions" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement?.querySelector('.placeholder-permissions')?.classList.remove('hidden');
                      }}
                    />
                    <div className="placeholder-permissions hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 text-gray-500">
                      <Shield className="w-16 h-16 mb-4 text-orange-300" />
                      <p className="text-lg font-medium">Rights & Permissions</p>
                      <p className="text-sm mt-2">Screenshot will appear here</p>
                    </div>
                  </div>
                </div>
                
               
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicManagementGuide;
