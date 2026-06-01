"use client";
import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "../../components/Layout";
import withClinicAuth from "../../components/withClinicAuth";
import type { NextPageWithLayout } from "../_app";
import {
  UserPlus,
  Calendar,
  Users,
  Building2,
  FileText,
  Briefcase,
  ClipboardList,
  CheckCircle,
  ArrowRight,
  BookOpen,
} from "lucide-react";

const WorkflowGuide: NextPageWithLayout = () => {
  const [activeSection, setActiveSection] = useState("overview");

  const workflowSections = [
    {
      id: "overview",
      title: "Overview",
      icon: <BookOpen className="w-5 h-5" />,
      description: "Complete clinic workflow from registration to daily operations"
    },
    {
      id: "registration",
      title: "User Registration",
      icon: <UserPlus className="w-5 h-5" />,
      description: "Create your clinic account and get started"
    },
    {
      id: "login",
      title: "Login Process",
      icon: <CheckCircle className="w-5 h-5" />,
      description: "Access your clinic dashboard securely"
    },
    {
      id: "dashboard",
      title: "Dashboard Overview",
      icon: <Building2 className="w-5 h-5" />,
      description: "Navigate through all available modules"
    },
    {
      id: "health-center",
      title: "Manage Health Center",
      icon: <Building2 className="w-5 h-5" />,
      description: "View and edit your clinic profile details"
    },
    {
      id: "create-agent",
      title: "Create Agent",
      icon: <Users className="w-5 h-5" />,
      description: "Add doctors and agents with clear role definitions"
    },
    {
      id: "create-lead",
      title: "Create Lead",
      icon: <UserPlus className="w-5 h-5" />,
      description: "Add new leads and manage the complete lead process"
    },
    {
      id: "setup-operation",
      title: "Setup Operation",
      icon: <ClipboardList className="w-5 h-5" />,
      description: "Configure operational settings like rooms and services"
    },
    {
      id: "appointment",
      title: "Appointment Booking",
      icon: <Calendar className="w-5 h-5" />,
      description: "Book appointments with doctors, rooms, and time slots"
    },
    {
      id: "scheduled-appointments",
      title: "Scheduled Appointments",
      icon: <Calendar className="w-5 h-5" />,
      description: "View and manage all upcoming appointments"
    },
    {
      id: "job-posting",
      title: "Job Posting",
      icon: <Briefcase className="w-5 h-5" />,
      description: "Post job requirements and manage recruitment"
    },
    {
      id: "patient-registration",
      title: "Patient Registration",
      icon: <Users className="w-5 h-5" />,
      description: "Register patients and manage their details"
    },
    {
      id: "write-blog",
      title: "Write Blog",
      icon: <FileText className="w-5 h-5" />,
      description: "Create and publish blogs using the clinic sidebar"
    }
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-teal-500 to-blue-600 rounded-xl p-6 text-white">
              <h2 className="text-2xl font-bold mb-3">Clinic Workflow Guide</h2>
              <p className="text-teal-100">
                This comprehensive guide walks you through the complete clinic workflow step by step, 
                from initial registration to daily operations management.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflowSections.slice(1).map((section) => (
                <div 
                  key={section.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setActiveSection(section.id)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-teal-600">
                      {section.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900">{section.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{section.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "registration":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <UserPlus className="w-8 h-8 text-teal-600" />
              <h2 className="text-2xl font-bold text-gray-900">User Registration</h2>
            </div>
            
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Getting Started</h3>
              <p className="text-gray-600 mb-4">
                The first step in your ZEVA journey is to create a clinic account. This process is simple and straightforward.
              </p>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <h4 className="font-semibold text-blue-800 mb-2">Registration Process:</h4>
                <ol className="list-decimal list-inside space-y-2 text-blue-700">
                  <li>Visit the clinic registration page</li>
                  <li>Enter your clinic details including name, address, and contact information</li>
                  <li>Set up your pricing and working hours</li>
                  <li>Verify your email address</li>
                  <li>Complete the profile setup</li>
                </ol>
              </div>
              
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Required Information</h4>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4 h-full flex flex-col">
                  <h4 className="font-semibold text-gray-800 mb-3">Registration Features:</h4>
                  <ul className="space-y-2 text-gray-700 flex-grow">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Simple clinic account creation
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Secure email verification process
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Profile completion wizard
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Instant dashboard access after setup
                    </li>
                  </ul>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4 h-full flex flex-col">
                  <h4 className="font-semibold text-gray-800 mb-3">Required Information:</h4>
                  <ul className="space-y-2 text-gray-700 flex-grow">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Clinic name and legal details
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Complete physical address
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Contact phone and email
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Consultation fees and timings
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Registration Process Screenshot</h4>
                <div className="border-2 border-gray-300 rounded-lg min-h-[400px] overflow-hidden bg-white">
                  <img 
                    src="/image9.png" 
                    alt="User Registration Form" 
                    className="w-full h-full object-contain p-4"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden w-full h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <UserPlus className="w-12 h-12 mx-auto mb-2" />
                      <p>Registration form screenshot</p>
                      <p className="text-sm">(Image will appear here)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "login":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="w-8 h-8 text-teal-600" />
              <h2 className="text-2xl font-bold text-gray-900">Login Process</h2>
            </div>
            
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Access Your Account</h3>
              <p className="text-gray-600 mb-4">
                Once registered, you can access your clinic dashboard using your credentials.
              </p>
              
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
                <h4 className="font-semibold text-green-800 mb-2">Login Steps:</h4>
                <ol className="list-decimal list-inside space-y-2 text-green-700">
                  <li>Navigate to the clinic login page</li>
                  <li>Enter your registered email address</li>
                  <li>Enter your password</li>
                  <li>Click login to access your dashboard</li>
                </ol>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4 h-full flex flex-col">
                  <h4 className="font-semibold text-gray-800 mb-3">Login Features:</h4>
                  <ul className="space-y-2 text-gray-700 flex-grow">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Secure authentication system
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Session management
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Password recovery options
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Multi-device session support
                    </li>
                  </ul>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4 h-full flex flex-col">
                  <h4 className="font-semibold text-gray-800 mb-3">Security Measures:</h4>
                  <ul className="space-y-2 text-gray-700 flex-grow">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Encrypted password storage
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Session timeout protection
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Two-factor authentication ready
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      IP address monitoring
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Login Interface Screenshot</h4>
                <div className="border-2 border-gray-300 rounded-lg min-h-[400px] overflow-hidden bg-white">
                  <img 
                    src="/login.png" 
                    alt="Login Page" 
                    className="w-full h-full object-contain p-4"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden w-full h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                      <p>Login page screenshot</p>
                      <p className="text-sm">(Image will appear here)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "dashboard":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="w-8 h-8 text-teal-600" />
              <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
            </div>
            
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Your Command Center</h3>
              <p className="text-gray-600 mb-4">
                The dashboard is your central hub where all clinic modules are visible and accessible.
              </p>
              
              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6">
                <h4 className="font-semibold text-purple-800 mb-2">Dashboard Features:</h4>
                <ul className="list-disc list-inside space-y-2 text-purple-700">
                  <li>Overview of all clinic activities</li>
                  <li>Quick access to all modules</li>
                  <li>Performance metrics and statistics</li>
                  <li>Recent activity feed</li>
                  <li>Quick action buttons</li>
                </ul>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4 h-full flex flex-col">
                  <h5 className="font-semibold text-gray-800 mb-2">Navigation Menu</h5>
                  <p className="text-sm text-gray-600 flex-grow">Access all clinic modules</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 h-full flex flex-col">
                  <h5 className="font-semibold text-gray-800 mb-2">Statistics Panel</h5>
                  <p className="text-sm text-gray-600 flex-grow">View key metrics</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 h-full flex flex-col">
                  <h5 className="font-semibold text-gray-800 mb-2">Recent Activity</h5>
                  <p className="text-sm text-gray-600 flex-grow">Latest updates</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Dashboard Interface Screenshot</h4>
                <div className="border-2 border-gray-300 rounded-lg min-h-[400px] overflow-hidden bg-white">
                  <img 
                    src="/dashboard.png" 
                    alt="Clinic Dashboard" 
                    className="w-full h-full object-contain p-4"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden w-full h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Building2 className="w-16 h-16 mx-auto mb-2" />
                      <p>Dashboard overview screenshot</p>
                      <p className="text-sm">(Image will appear here)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "health-center":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="w-8 h-8 text-teal-600" />
              <h2 className="text-2xl font-bold text-gray-900">Manage Health Center</h2>
            </div>
            
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Clinic Profile Management</h3>
              <p className="text-gray-600 mb-4">
                View and edit your clinic's profile details to keep information up to date.
              </p>
              
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
                <h4 className="font-semibold text-amber-800 mb-2">Profile Management:</h4>
                <ul className="list-disc list-inside space-y-2 text-amber-700">
                  <li>Update clinic name and description</li>
                  <li>Modify contact information</li>
                  <li>Adjust pricing and timings</li>
                  <li>Update services offered</li>
                  <li>Manage clinic images and branding</li>
                </ul>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 h-full">
                <div className="bg-gray-50 rounded-lg p-4 h-full flex flex-col">
                  <h4 className="font-semibold text-gray-800 mb-2">Editable Information</h4>
                  <ul className="space-y-2 text-gray-700 flex-grow">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Clinic details and contact info
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Working hours and availability
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Services and specializations
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Pricing information
                    </li>
                  </ul>
                </div>
                
              <div className="bg-gray-50 rounded-lg p-4 h-full">
                <h4 className="font-semibold text-gray-800 mb-2">Screenshot: Profile Edit</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg h-full min-h-[400px] flex items-center justify-center bg-white">
                    <div className="text-center text-gray-500">
                      <Building2 className="w-12 h-12 mx-auto mb-2" />
                      <p>Profile management interface</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "create-agent":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-8 h-8 text-teal-600" />
              <h2 className="text-2xl font-bold text-gray-900">Create Agent</h2>
            </div>
            
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Add Doctors and Agents</h3>
              <p className="text-gray-600 mb-4">
                Add medical professionals and staff members to your clinic with clear role definitions.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 mb-6 h-full">
                <div className="bg-white border border-gray-200 rounded-lg p-4 h-full flex flex-col">
                  <h4 className="font-semibold text-gray-800 mb-3">Agent Types:</h4>
                  <div className="space-y-3 flex-grow">
                    <div className="bg-indigo-50 rounded-lg p-3">
                      <h5 className="font-semibold text-indigo-700 mb-2">Doctors</h5>
                      <ul className="text-sm text-indigo-600 space-y-1">
                        <li>• Medical qualifications</li>
                        <li>• Specialization details</li>
                        <li>• Availability schedule</li>
                        <li>• Consultation fees</li>
                      </ul>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3">
                      <h5 className="font-semibold text-indigo-700 mb-2">Agents/Staff</h5>
                      <ul className="text-sm text-indigo-600 space-y-1">
                        <li>• Staff roles and permissions</li>
                        <li>• Contact information</li>
                        <li>• Working hours</li>
                        <li>• Department assignment</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 h-full">
                  <h4 className="font-semibold text-gray-800 mb-2">Screenshot: Agent Creation Form</h4>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg h-full min-h-[400px] flex items-center justify-center bg-white">
                    <div className="text-center text-gray-500">
                      <Users className="w-16 h-16 mx-auto mb-2" />
                      <p>Agent/Doctor creation interface</p>
                      <p className="text-sm">With role-specific fields and permissions</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-800 mb-2">Required Details for Agents:</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Full name and contact details
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Professional qualifications
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Specialization and expertise
                    </li>
                  </ul>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Working schedule and availability
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Consultation fees (for doctors)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Role-specific permissions
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Screenshot: Agent Creation Form</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg h-72 flex items-center justify-center bg-white">
                  <div className="text-center text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-2" />
                    <p>Agent/Doctor creation interface</p>
                    <p className="text-sm">With role-specific fields and permissions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "create-lead":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <UserPlus className="w-8 h-8 text-teal-600" />
              <h2 className="text-2xl font-bold text-gray-900">Create Lead</h2>
            </div>
            
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Lead Management System</h3>
              <p className="text-gray-600 mb-4">
                Add new leads and manage the complete lead creation and conversion process.
              </p>
              
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
                <h4 className="font-semibold text-green-800 mb-2">Lead Creation Process:</h4>
                <ol className="list-decimal list-inside space-y-2 text-green-700">
                  <li>Enter lead source and basic information</li>
                  <li>Provide contact details (name, phone, email)</li>
                  <li>Specify service interest and requirements</li>
                  <li>Assign to appropriate staff member</li>
                  <li>Set follow-up reminders and deadlines</li>
                </ol>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6 h-full">
                <div className="bg-white border border-gray-200 rounded-lg p-4 h-full flex flex-col">
                  <h4 className="font-semibold text-gray-800 mb-3">Lead Information Required:</h4>
                  <ul className="space-y-2 text-gray-700 flex-grow">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Personal details (name, contact)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Service requirements
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Preferred appointment timing
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Source of lead information
                    </li>
                  </ul>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4 h-full">
                  <h4 className="font-semibold text-gray-800 mb-3">Lead Management Features:</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Lead status tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Assignment to team members
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Follow-up scheduling
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Conversion tracking
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 h-full">
                <h4 className="font-semibold text-gray-800 mb-2">Screenshot: Lead Creation Interface</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg h-full min-h-[400px] flex items-center justify-center bg-white">
                  <div className="text-center text-gray-500">
                    <UserPlus className="w-12 h-12 mx-auto mb-2" />
                    <p>Lead creation and management form</p>
                    <p className="text-sm">Complete lead lifecycle management</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "setup-operation":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <ClipboardList className="w-8 h-8 text-teal-600" />
              <h2 className="text-2xl font-bold text-gray-900">Setup Operation</h2>
            </div>
            
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Operational Configuration</h3>
              <p className="text-gray-600 mb-4">
                Configure your clinic's operational settings including rooms, services, and facilities.
              </p>
              
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6">
                <h4 className="font-semibold text-orange-800 mb-2">Operational Setup Includes:</h4>
                <div className="grid md:grid-cols-3 gap-4 mt-3">
                  <div className="bg-white rounded-lg p-3">
                    <h5 className="font-semibold text-orange-700 mb-2">Rooms Setup</h5>
                    <ul className="text-sm text-orange-600 space-y-1">
                      <li>• Create examination rooms</li>
                      <li>• Set room capacities</li>
                      <li>• Define room purposes</li>
                      <li>• Schedule maintenance</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <h5 className="font-semibold text-orange-700 mb-2">Services Configuration</h5>
                    <ul className="text-sm text-orange-600 space-y-1">
                      <li>• Define service categories</li>
                      <li>• Set service prices</li>
                      <li>• Configure service duration</li>
                      <li>• Manage service availability</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <h5 className="font-semibold text-orange-700 mb-2">Facility Management</h5>
                    <ul className="text-sm text-orange-600 space-y-1">
                      <li>• Equipment inventory</li>
                      <li>• Staff scheduling</li>
                      <li>• Resource allocation</li>
                      <li>• Operational hours</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6 h-full">
                <div className="bg-gray-50 rounded-lg p-4 h-full flex flex-col">
                  <h4 className="font-semibold text-gray-800 mb-2">Room Management</h4>
                  <ul className="space-y-2 text-gray-700 flex-grow">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Create and name examination rooms
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Set room availability schedules
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Define room equipment and facilities
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Manage room booking conflicts
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 h-full">
                  <h4 className="font-semibold text-gray-800 mb-2">Screenshot: Operations Setup</h4>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg h-full min-h-[400px] flex items-center justify-center bg-white">
                    <div className="text-center text-gray-500">
                      <ClipboardList className="w-12 h-12 mx-auto mb-2" />
                      <p>Operational setup interface</p>
                      <p className="text-sm">Rooms, services, and facility configuration</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "appointment":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-8 h-8 text-teal-600" />
              <h2 className="text-2xl font-bold text-gray-900">Appointment Booking</h2>
            </div>
            
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Scheduling System</h3>
              <p className="text-gray-600 mb-4">
                Book appointments by selecting doctors, rooms, and appropriate time slots.
              </p>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <h4 className="font-semibold text-blue-800 mb-2">Appointment Booking Process:</h4>
                <ol className="list-decimal list-inside space-y-2 text-blue-700">
                  <li>Select the date for the appointment</li>
                  <li>Choose available doctor from the list</li>
                  <li>Select appropriate room/facility</li>
                  <li>Pick available time slot</li>
                  <li>Enter patient details</li>
                  <li>Confirm and send appointment notification</li>
                </ol>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 mb-6 h-full">
                <div className="bg-white border border-gray-200 rounded-lg p-4 h-full flex flex-col">
                  <h4 className="font-semibold text-gray-800 mb-2">Doctor Selection</h4>
                  <p className="text-sm text-gray-600 flex-grow">Choose from available doctors based on specialization and availability</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 h-full flex flex-col">
                  <h4 className="font-semibold text-gray-800 mb-2">Room Assignment</h4>
                  <p className="text-sm text-gray-600 flex-grow">Select appropriate examination room based on procedure requirements</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 h-full flex flex-col">
                  <h4 className="font-semibold text-gray-800 mb-2">Time Slot Management</h4>
                  <p className="text-sm text-gray-600 flex-grow">Choose from available time slots with real-time availability updates</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 h-full">
                <h4 className="font-semibold text-gray-800 mb-2">Screenshot: Appointment Booking Interface</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg h-full min-h-[400px] flex items-center justify-center bg-white">
                  <div className="text-center text-gray-500">
                    <Calendar className="w-16 h-16 mx-auto mb-2" />
                    <p>Appointment scheduling calendar view</p>
                    <p className="text-sm">Doctor, room, and time slot selection interface</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "scheduled-appointments":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-8 h-8 text-teal-600" />
              <h2 className="text-2xl font-bold text-gray-900">Scheduled Appointments</h2>
            </div>
            
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Appointment Management</h3>
              <p className="text-gray-600 mb-4">
                View and manage all upcoming appointments with comprehensive scheduling tools.
              </p>
              
              <div className="bg-teal-50 border-l-4 border-teal-500 p-4 mb-6">
                <h4 className="font-semibold text-teal-800 mb-2">Appointment Management Features:</h4>
                <ul className="list-disc list-inside space-y-2 text-teal-700">
                  <li>View all scheduled appointments in calendar format</li>
                  <li>Filter appointments by date, doctor, or status</li>
                  <li>Update appointment details and status</li>
                  <li>Send appointment reminders to patients</li>
                  <li>Manage appointment conflicts and rescheduling</li>
                  <li>Track appointment completion and follow-ups</li>
                </ul>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6 h-full">
                <div className="bg-white border border-gray-200 rounded-lg p-4 h-full flex flex-col">
                  <h4 className="font-semibold text-gray-800 mb-3">Appointment Status Tracking:</h4>
                  <ul className="space-y-2 text-gray-700 flex-grow">
                    <li className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Scheduled</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>Confirmed</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Completed</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Cancelled</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4 h-full">
                  <h4 className="font-semibold text-gray-800 mb-3">Management Actions:</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Reschedule appointments
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Send automated reminders
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Update appointment status
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Generate appointment reports
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 h-full">
                <h4 className="font-semibold text-gray-800 mb-2">Screenshot: Appointment Schedule View</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg h-full min-h-[400px] flex items-center justify-center bg-white">
                  <div className="text-center text-gray-500">
                    <Calendar className="w-16 h-16 mx-auto mb-2" />
                    <p>Comprehensive appointment schedule</p>
                    <p className="text-sm">Calendar view with all upcoming appointments</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "job-posting":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Briefcase className="w-8 h-8 text-teal-600" />
              <h2 className="text-2xl font-bold text-gray-900">Job Posting</h2>
            </div>
            
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Recruitment Management</h3>
              <p className="text-gray-600 mb-4">
                Post job requirements and manage the complete recruitment process for your clinic.
              </p>
              
              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6">
                <h4 className="font-semibold text-purple-800 mb-2">Job Posting Features:</h4>
                <ul className="list-disc list-inside space-y-2 text-purple-700">
                  <li>Create detailed job descriptions</li>
                  <li>Specify required qualifications and experience</li>
                  <li>Set salary ranges and benefits</li>
                  <li>Define application deadlines</li>
                  <li>Manage applicant submissions</li>
                  <li>Track recruitment progress</li>
                </ul>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6 h-full">
                <div className="bg-gray-50 rounded-lg p-4 h-full flex flex-col">
                  <h4 className="font-semibold text-gray-800 mb-2">Job Posting Information:</h4>
                  <ul className="space-y-2 text-gray-700 flex-grow">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Position title and department
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Required qualifications
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Experience requirements
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Compensation and benefits
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 h-full">
                  <h4 className="font-semibold text-gray-800 mb-2">Applicant Management:</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Review applications
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Schedule interviews
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Track candidate status
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Send offer letters
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 h-full">
                <h4 className="font-semibold text-gray-800 mb-2">Screenshot: Job Posting Interface</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg h-full min-h-[400px] flex items-center justify-center bg-white">
                  <div className="text-center text-gray-500">
                    <Briefcase className="w-12 h-12 mx-auto mb-2" />
                    <p>Job posting creation form</p>
                    <p className="text-sm">Complete recruitment management system</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "patient-registration":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-8 h-8 text-teal-600" />
              <h2 className="text-2xl font-bold text-gray-900">Patient Registration</h2>
            </div>
            
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Patient Management System</h3>
              <p className="text-gray-600 mb-4">
                Register new patients and manage their complete medical and contact information.
              </p>
              
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
                <h4 className="font-semibold text-green-800 mb-2">Patient Registration Process:</h4>
                <ol className="list-decimal list-inside space-y-2 text-green-700">
                  <li>Enter basic patient information (name, DOB, contact)</li>
                  <li>Collect medical history and current conditions</li>
                  <li>Record emergency contact information</li>
                  <li>Set up patient portal access</li>
                  <li>Link to insurance information</li>
                  <li>Create unique patient ID</li>
                </ol>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6 h-full">
                <div className="bg-white border border-gray-200 rounded-lg p-4 h-full flex flex-col">
                  <h4 className="font-semibold text-gray-800 mb-3">Required Patient Information:</h4>
                  <ul className="space-y-2 text-gray-700 flex-grow">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Personal details and demographics
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Contact information
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Medical history
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Insurance details
                    </li>
                  </ul>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4 h-full">
                  <h4 className="font-semibold text-gray-800 mb-3">Management Features:</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Update patient records
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Track appointment history
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Manage prescriptions
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Generate patient reports
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 h-full">
                <h4 className="font-semibold text-gray-800 mb-2">Screenshot: Patient Registration Form</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg h-full min-h-[400px] flex items-center justify-center bg-white">
                  <div className="text-center text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-2" />
                    <p>Comprehensive patient registration interface</p>
                    <p className="text-sm">Medical history and contact management</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "write-blog":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-8 h-8 text-teal-600" />
              <h2 className="text-2xl font-bold text-gray-900">Write Blog</h2>
            </div>
            
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Content Management</h3>
              <p className="text-gray-600 mb-4">
                Create and publish blogs using the clinic sidebar to share health information and clinic updates.
              </p>
              
              <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6">
                <h4 className="font-semibold text-indigo-800 mb-2">Blog Creation Features:</h4>
                <ul className="list-disc list-inside space-y-2 text-indigo-700">
                  <li>Rich text editor with formatting options</li>
                  <li>Image upload and management</li>
                  <li>Category and tag assignment</li>
                  <li>Schedule publishing for future dates</li>
                  <li>SEO optimization tools</li>
                  <li>Draft saving and version control</li>
                </ul>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6 h-full">
                <div className="bg-gray-50 rounded-lg p-4 h-full flex flex-col">
                  <h4 className="font-semibold text-gray-800 mb-2">Blog Content Elements:</h4>
                  <ul className="space-y-2 text-gray-700 flex-grow">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Title and meta description
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Featured images
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Content formatting and styling
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Categories and tags
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 h-full">
                  <h4 className="font-semibold text-gray-800 mb-2">Publishing Options:</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Immediate publishing
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Schedule for later
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Save as draft
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Preview before publishing
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 h-full">
                <h4 className="font-semibold text-gray-800 mb-2">Screenshot: Blog Editor Interface</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg h-full min-h-[400px] flex items-center justify-center bg-white">
                  <div className="text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2" />
                    <p>Advanced blog creation editor</p>
                    <p className="text-sm">With formatting tools and media management</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Section</h3>
            <p className="text-gray-600">Choose a workflow section from the navigation to get started</p>
          </div>
        );
    }
  };

  return (
    <>
      <Head>
        <title>Clinic Workflow Guide | ZEVA</title>
        <meta name="description" content="Complete step-by-step guide for clinic workflow management in ZEVA" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Clinic Workflow Guide</h1>
                <p className="text-gray-600 mt-2">Complete step-by-step documentation for clinic operations</p>
              </div>
              <Link 
                href="/clinic/clinic-dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                Back to Dashboard
              </Link>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-8">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="font-semibold text-gray-900">Workflow Sections</h2>
                </div>
                <nav className="p-4">
                  <ul className="space-y-1">
                    {workflowSections.map((section) => (
                      <li key={section.id}>
                        <button
                          onClick={() => setActiveSection(section.id)}
                          className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                            activeSection === section.id
                              ? "bg-teal-50 text-teal-700 border border-teal-200"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span className={activeSection === section.id ? "text-teal-600" : "text-gray-500"}>
                            {section.icon}
                          </span>
                          <div>
                            <div className="font-medium">{section.title}</div>
                            <div className="text-sm text-gray-500">{section.description}</div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
                {renderSectionContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

WorkflowGuide.getLayout = function PageLayout(page: React.ReactElement) {
  return <Layout>{page}</Layout>;
};

const ProtectedWorkflowGuide = withClinicAuth(WorkflowGuide) as NextPageWithLayout;
ProtectedWorkflowGuide.getLayout = WorkflowGuide.getLayout;

export default ProtectedWorkflowGuide;