"use client";
import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "../../components/Layout";
import withClinicAuth from "../../components/withClinicAuth";
import BookAppointmentWorkflowGuide from '../../components/clinic/BookAppointmentWorkflowGuide';
import ScheduledAppointmentsWorkflowGuide from '../../components/clinic/ScheduledAppointmentsWorkflowGuide';
import ComplaintWorkflowGuide from '../../components/clinic/ComplaintWorkflowGuide';
import PatientRegistrationWorkflowGuide from '../../components/clinic/PatientRegistrationWorkflowGuide';
import type { NextPageWithLayout } from "../_app";
import ManageHealthCenterGuide from "../../components/clinic/ManageHealthCenterGuide";
import CreateOffersGuide from "../../components/clinic/CreateOffersGuide";
import UserPackagesGuide from "../../components/clinic/UserPackagesGuide";
import ServicesGuide from "../../components/clinic/ServicesGuide";
import SetupOperationGuide from "../../components/clinic/SetupOperationGuide";
import ConsentFormGuide from "../../components/clinic/ConsentFormGuide";
import JobPostingGuide from "../../components/clinic/JobPostingGuide";
import CommissionGuide from "../../components/clinic/CommissionGuide";
import ClinicManagementGuide from "../../components/clinic/ClinicManagementGuide";
import ReferralGuide from "../../components/clinic/ReferralGuide";
import CreateLeadGuide from "../../components/clinic/CreateLeadGuide";
import ReviewsGuide from "../../components/clinic/ReviewsGuide";
import TemplatesGuide from "../../components/clinic/TemplatesGuide";
import InboxGuide from "../../components/clinic/InboxGuide";
import PettyCashWorkflowGuide from '../../components/clinic/PettyCashWorkflowGuide';
import ReportsAnalyticsWorkflowGuide from '../../components/clinic/ReportsAnalyticsWorkflowGuide';
import SecurityPrivacyWorkflowGuide from '../../components/clinic/SecurityPrivacyWorkflowGuide';
import WriteBlogWorkflowGuide from '../../components/clinic/WriteBlogWorkflowGuide';
import ProvidersGuide from "../../components/clinic/ProvidersGuide";
import LocationsGuide from "../../components/clinic/LocationsGuide";
import SuppliersGuide from "../../components/clinic/SuppliersGuide";
import UOMGuide from "../../components/clinic/UOMGuide";
import PurchaseRequestsGuide from "../../components/clinic/PurchaseRequestsGuide";
import PurchaseOrdersGuide from "../../components/clinic/PurchaseOrdersGuide";
import GRNGuide from "../../components/clinic/GRNGuide";
import PurchaseInvoicesGuide from "../../components/clinic/PurchaseInvoicesGuide";
import PurchaseReturnsGuide from "../../components/clinic/PurchaseReturnsGuide";
import StockAdjustmentGuide from "../../components/clinic/StockAdjustmentGuide";
import TransferRequestsGuide from "../../components/clinic/TransferRequestsGuide";
import TransferStockGuide from "../../components/clinic/TransferStockGuide";
import MaterialActivityGuide from "../../components/clinic/MaterialActivityGuide";
import ConsumptionsGuide from "../../components/clinic/ConsumptionsGuide";
import AllocatedStockGuide from "../../components/clinic/AllocatedStockGuide";
import PolicyComplianceGuide from "../../components/clinic/PolicyComplianceGuide";

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
  ChevronDown,

  Settings,
} from "lucide-react";

const WorkflowGuide: NextPageWithLayout = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [selectedSubItem, setSelectedSubItem] = useState<string | null>(null);
  
  // State for image slideshow in different sections
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Images for appointment slideshow
  // const appointmentImages = ["/appoint.png", "/book.png", "/save.png"];
  
  // const nextAppointmentImage = () => {
  //   setCurrentImageIndex((prevIndex) => (prevIndex + 1) % appointmentImages.length);
  // };
  
  // const prevAppointmentImage = () => {
  //   setCurrentImageIndex((prevIndex) => (prevIndex - 1 + appointmentImages.length) % appointmentImages.length);
  // };
  
  const workflowSections = [
    {
      id: "overview",
      title: "Overview",
      icon: <BookOpen className="w-5 h-5" />,
      description: "Complete clinic workflow from registration to daily operations"
    },
    {
      id: "dashboard",
      title: "Dashboard",
      icon: <Building2 className="w-5 h-5" />,
      description: "Navigate through all available modules"
    },
    {
      id: "business-management",
      title: "Business Management",
      icon: <Briefcase className="w-5 h-5" />,
     
      children: [
        { label: "Manage Health Center", id: "manage-health-center", icon: "🏥" },
        { label: "Create Offers", id: "create-offers", icon: "🎁" },
        { label: "User Package", id: "user-package", icon: "📦" },
        { label: "Service Setup", id: "service-setup", icon: "⚙️" },
        { label: "Setup & Operation", id: "setup-operation", icon: "🏢" },
      ]
    },
    {
      id: "hr-management",
      title: "HR Management",
      icon: <Users className="w-5 h-5" />,
      
      children: [
        { label: "Consent Form", id: "consent-form", icon: "📝" },
        { label: "Job Posting", id: "job-posting", icon: "📋" },
        { label: "Commission", id: "commission", icon: "💰" },
        { label: "Referral", id: "referral", icon: "🎯" },
        { label: "Create Agent", id: "create-agent", icon: "👤" },
      ]
    },
    {
      id: "marketing",
      title: "Marketing",
      icon: <UserPlus className="w-5 h-5" />,
     
      children: [
        { label: "Create Lead", id: "create-lead", icon: "➕" },
        { label: "Inbox", id: "inbox", icon: "📨" },
        { label: "Templates", id: "templates", icon: "📄" },
        { label: "Providers", id: "providers", icon: "👥" },
        { label: "Reviews", id: "reviews", icon: "⭐" },
      ]
    },
    {
      id: "content-seo",
      title: "Content & SEO",
      icon: <FileText className="w-5 h-5" />,
     
      children: [
        { label: "Write Blog", id: "write-blog", icon: "✍️" },
      ]
    },
    {
      id: "stock-management",
      title: "Stock Management",
      icon: <ClipboardList className="w-5 h-5" />,
      
      children: [
        { label: "Locations", id: "locations", icon: "📍" },
        { label: "Suppliers", id: "suppliers", icon: "🏭" },
        { label: "UOM", id: "uom", icon: "📏" },
        { label: "Purchase Requests", id: "purchase-requests", icon: "📝" },
        { label: "Purchase Orders", id: "purchase-orders", icon: "🛒" },
        { label: "GRN", id: "grn", icon: "📦" },
        { label: "Purchase Invoices", id: "purchase-invoices", icon: "🧾" },
        { label: "Purchase Returns", id: "purchase-returns", icon: "↩️" },
        { label: "Stock Qty Adjustment", id: "stock-adjustment", icon: "⚖️" },
        { label: "Stock Transfer Requests", id: "transfer-requests", icon: "📋" },
        { label: "Transfer Stock", id: "transfer-stock", icon: "🚚" },
        { label: "Material Activity Consumption", id: "material-activity", icon: "📊" },
        { label: "Allocated Stock Items", id: "allocated-stock", icon: "🔒" },
      ]
    },
    {
      id: "policy-compliance",
      title: "Policy & Compliance",
      icon: <Settings className="w-5 h-5" />,
      description: "Clinic policies, compliance guidelines, and regulatory requirements"
    },
    {
      id: "patients-appointments",
      title: "Patients & Appointments",
      icon: <Calendar className="w-5 h-5" />,
      
      children: [
        { label: "Book Appointments", id: "book-appointments", icon: "📅" },
        { label: "Scheduled Appointments", id: "scheduled-appointments", icon: "✅" },
        { label: "Patient Registration", id: "patient-registration", icon: "👤" },
      ]
    },
    {
      id: "security-privacy",
      title: "Security & Privacy",
      icon: <CheckCircle className="w-5 h-5" />,
      description: "Authentication and security settings"
    },
   
    {
      id: "reports-analytics",
      title: "Reports & Analytics",
      icon: <ClipboardList className="w-5 h-5" />,
     
      children: [
      
        { label: "Petty Cash", id: "petty-cash", icon: "💵" },
        { label: "Reports", id: "reports", icon: "📊" },
      ]
    }
  ];

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      if (prev.includes(moduleId)) {
        // Close if already open
        return prev.filter(id => id !== moduleId);
      } else {
        // Open this one and close all others
        // Also select the first child item automatically
        const section = workflowSections.find(s => s.id === moduleId);
        if (section?.children && section.children.length > 0) {
          setSelectedSubItem(section.children[0].id);
        }
        return [moduleId];
      }
    });
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500 to-blue-600 rounded-xl p-8 text-white">
              <h2 className="text-3xl font-bold mb-3">Clinic Workflow Guide - Complete Overview</h2>
              <p className="text-teal-100 text-lg">
                Welcome to the ZEVA Clinic Management System. This comprehensive guide covers all modules, 
                features, and workflows to help you manage your clinic efficiently from day one.
              </p>
            </div>
            
            {/* Available Modules */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
              <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2 text-lg">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
                Available Modules - Use Left Sidebar to Navigate
              </h4>
              <p className="text-sm text-blue-800 mb-4">
                Below are all the modules available in the clinic workflow system. Click on any module in the left sidebar to view detailed step-by-step guides.
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {workflowSections.slice(1).map((section) => (
                  <div 
                    key={section.id}
                    className="bg-white rounded-lg border border-blue-200 p-4 opacity-75 hover:opacity-100 transition-opacity"
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-teal-600 text-xl">
                        {section.icon}
                      </div>
                      <h3 className="font-semibold text-gray-900">{section.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Features */}
            <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg">
              <h4 className="font-semibold text-green-900 mb-4 flex items-center gap-2 text-lg">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Key System Features
              </h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h5 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">🏥</span> Clinic Management
                  </h5>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li>✓ Complete health center profile management</li>
                    <li>✓ Service setup and configuration</li>
                    <li>✓ Operational hours and settings</li>
                    <li>✓ Custom offers and promotions</li>
                    <li>✓ User packages and subscriptions</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h5 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">👥</span> HR & Staff Management
                  </h5>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li>✓ Doctor and staff onboarding</li>
                    <li>✓ Commission tracking and management</li>
                    <li>✓ Referral program management</li>
                    <li>✓ Job posting and applications</li>
                    <li>✓ Consent form management</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h5 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">📊</span> Stock & Inventory
                  </h5>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li>✓ Multi-location warehouse management</li>
                    <li>✓ Purchase orders and GRN processing</li>
                    <li>✓ Stock transfers between locations</li>
                    <li>✓ Consumption tracking for treatments</li>
                    <li>✓ Inventory adjustments and audits</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h5 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">📅</span> Patient & Appointments
                  </h5>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li>✓ Online appointment booking system</li>
                    <li>✓ Patient registration and records</li>
                    <li>✓ Scheduled appointments management</li>
                    <li>✓ Complaint and feedback tracking</li>
                    <li>✓ Appointment history and reports</li>
                  </ul>
                </div>
              </div>
            </div>

           
            
            
            {/* How to Navigate */}
            <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-lg">
              <h4 className="font-semibold text-orange-900 mb-4 flex items-center gap-2 text-lg">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                How to Use This Guide
              </h4>
              <div className="bg-white rounded-lg p-5 border border-orange-200">
                <ol className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                    <div>
                      <strong className="text-orange-900">Expand a Module:</strong>
                      <p className="text-sm text-orange-800 mt-1">Click on any module name in the left sidebar (e.g., "Stock Management", "HR Management"). The module will expand and show all available topics.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                    <div>
                      <strong className="text-orange-900">Auto-Load First Topic:</strong>
                      <p className="text-sm text-orange-800 mt-1">When you expand a module, the first topic automatically loads and displays in the main content area.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                    <div>
                      <strong className="text-orange-900">Select Specific Topics:</strong>
                      <p className="text-sm text-orange-800 mt-1">Click on any sub-topic within the expanded module to view its detailed guide with step-by-step instructions.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                    <div>
                      <strong className="text-orange-900">Accordion Navigation:</strong>
                      <p className="text-sm text-orange-800 mt-1">Only one module can be expanded at a time. Opening a new module automatically closes the previous one for cleaner navigation.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
                    <div>
                      <strong className="text-orange-900">Follow Visual Guides:</strong>
                      <p className="text-sm text-orange-800 mt-1">Each topic includes detailed screenshots, step-by-step instructions, and best practices to help you master the system.</p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>

            {/* Best Practices */}
            <div className="bg-teal-50 border-l-4 border-teal-500 p-6 rounded-r-lg">
              <h4 className="font-semibold text-teal-900 mb-4 flex items-center gap-2 text-lg">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Best Practices for Using the System
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-teal-200">
                  <h5 className="font-semibold text-teal-900 mb-2">📋 Getting Started</h5>
                  <ul className="space-y-2 text-sm text-teal-800">
                    <li>• Start with Business Management to set up your clinic</li>
                    <li>• Add all staff members through HR Management</li>
                    <li>• Configure your services and pricing</li>
                    <li>• Set up stock locations and suppliers</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4 border border-teal-200">
                  <h5 className="font-semibold text-teal-900 mb-2">🎯 Daily Operations</h5>
                  <ul className="space-y-2 text-sm text-teal-800">
                    <li>• Check dashboard every morning for appointments</li>
                    <li>• Register new patients before their visits</li>
                    <li>• Record consumptions after each treatment</li>
                    <li>• Monitor stock levels and reorder when needed</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4 border border-teal-200">
                  <h5 className="font-semibold text-teal-900 mb-2">📈 Growth & Marketing</h5>
                  <ul className="space-y-2 text-sm text-teal-800">
                    <li>• Create leads from inquiries and walk-ins</li>
                    <li>• Use WhatsApp templates for communication</li>
                    <li>• Write blogs to improve SEO ranking</li>
                    <li>• Monitor reviews and respond promptly</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4 border border-teal-200">
                  <h5 className="font-semibold text-teal-900 mb-2">🔒 Security & Compliance</h5>
                  <ul className="space-y-2 text-sm text-teal-800">
                    <li>• Review user permissions regularly</li>
                    <li>• Keep patient data secure and private</li>
                    <li>• Backup important reports monthly</li>
                    <li>• Update staff access when roles change</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Support & Help */}
           
          </div>
        );

      case "business-management":
        // If create-offers sub-item is selected, show CreateOffersGuide
        if (selectedSubItem === "create-offers") {
          return <CreateOffersGuide />;
        }
        // If user-package sub-item is selected, show UserPackagesGuide
        if (selectedSubItem === "user-package") {
          return <UserPackagesGuide />;
        }
        if (selectedSubItem === "service-setup") {
          return <ServicesGuide />;
        }
        if (selectedSubItem === "setup-operation") {
          return <SetupOperationGuide />;
        }
        
        // Otherwise show ManageHealthCenterGuide (default)
        return <ManageHealthCenterGuide selectedSubItem={selectedSubItem} />;

      case "hr-management":
        // If no sub-item selected, show default message
        if (selectedSubItem === "consent-form") {
          return <ConsentFormGuide />;
        }
        if (selectedSubItem === "job-posting") {
          return <JobPostingGuide />;
        }
        if (selectedSubItem === "commission") {
          return <CommissionGuide />;
        }
        if (selectedSubItem === "referral") {
          return <ReferralGuide />;
        }
        
        if (selectedSubItem === "create-agent") {
          return <ClinicManagementGuide />;
        }

        return (
          <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="text-center mb-8">
              <Users className="w-16 h-16 text-teal-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">HR Management</h2>
              <p className="text-gray-600">Select a Section</p>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-8 rounded-r-lg shadow-sm">
              <div className="flex items-start gap-4">
                <BookOpen className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Choose a workflow section from the navigation to get started</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm text-blue-700 mt-4">
                    <li>Click on any item in the left sidebar navigation</li>
                    <li>View detailed guides and documentation</li>
                    <li>Follow step-by-step instructions for each topic</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case "marketing":
        if (selectedSubItem === "create-lead") {
          return <CreateLeadGuide />;
        }
        if (selectedSubItem === "reviews") {
          return <ReviewsGuide />;
        }
        if (selectedSubItem === "templates") {
          return <TemplatesGuide />;
        }
        if (selectedSubItem === "inbox") {
          return <InboxGuide />;
        }
        if (selectedSubItem === "providers") {
          return <ProvidersGuide />;
        }
        return (
          <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="text-center mb-8">
              <UserPlus className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Marketing</h2>
              <p className="text-gray-600">Select a Section</p>
            </div>
            <div className="bg-purple-50 border-l-4 border-purple-500 p-8 rounded-r-lg shadow-sm">
              <div className="flex items-start gap-4">
                <FileText className="w-8 h-8 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-purple-900 mb-2">Choose a marketing section from the navigation to get started</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm text-purple-700 mt-4">
                    <li>Create Lead - Add new prospects to your CRM</li>
                    <li>Inbox - Manage all communications</li>
                    <li>Templates - Email and SMS templates</li>
                    <li>Providers - Marketing service providers</li>
                    <li>Reviews - Patient reviews and ratings</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case "content-seo":
        if (selectedSubItem === "write-blog") {
          return <WriteBlogWorkflowGuide />;
        }
        
        return (
          <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="text-center mb-8">
              <FileText className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Content & SEO</h2>
              <p className="text-gray-600">Select a Section</p>
            </div>
            <div className="bg-purple-50 border-l-4 border-purple-500 p-8 rounded-r-lg shadow-sm">
              <div className="flex items-start gap-4">
                <BookOpen className="w-8 h-8 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-purple-900 mb-2">Choose a content section from the navigation to get started</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm text-purple-700 mt-4">
                    <li>Write Blog - Create and publish engaging blog posts with rich media</li>
                  </ul>
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
              
              <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6">
                <h4 className="font-semibold text-indigo-800 mb-2">Advanced Login Options:</h4>
                <ul className="list-disc list-inside space-y-2 text-indigo-700">
                  <li>Single Sign-On (SSO) integration capabilities</li>
                  <li>Biometric authentication support</li>
                  <li>Social login options (Google, Microsoft)</li>
                  <li>Custom domain login configuration</li>
                  <li>API key authentication for integrations</li>
                </ul>
              </div>
              
              <div className="bg-pink-50 border-l-4 border-pink-500 p-4 mb-6">
                <h4 className="font-semibold text-pink-800 mb-2">Login Best Practices:</h4>
                <ol className="list-decimal list-inside space-y-2 text-pink-700">
                  <li>Use strong, unique passwords for each account</li>
                  <li>Enable two-factor authentication when available</li>
                  <li>Regularly review active sessions and devices</li>
                  <li>Log out from shared or public computers</li>
                  <li>Report suspicious login attempts immediately</li>
                </ol>
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
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-3 mb-8">
              <Building2 className="w-10 h-10 text-teal-600" />
              <h2 className="text-3xl font-bold text-gray-900">Clinic Dashboard Overview</h2>
            </div>

            <div className="prose max-w-none">
              <p className="text-base text-gray-600 mb-8 leading-relaxed">
                The <strong>Clinic Dashboard</strong> is your central hub. It gives you a real-time overview of all
                clinic activity — from appointments and revenue to leads and patient trends.
                Use the date filters at the top to switch between Today, This Week, This Month, or Overall views.
              </p>

              {/* 1. Layout & Navigation */}
              <div className="bg-gradient-to-r from-teal-50 to-blue-50 border-l-4 border-teal-500 p-8 mb-10 rounded-r-lg">
                <h4 className="font-bold text-lg text-teal-900 mb-5 flex items-center gap-2">
                  <span className="flex items-center justify-center w-10 h-10 bg-teal-600 text-white rounded-full text-base font-bold">1</span>
                  Dashboard Layout &amp; Navigation
                </h4>
                <div className="ml-12 space-y-4">
                  <p className="text-base text-teal-800 leading-relaxed">
                    The dashboard uses a persistent left sidebar for navigation and a main content area for data.
                  </p>
                  {/* Dashboard Screenshot */}
                  <div className="w-full bg-teal-50 rounded-xl border border-teal-200 p-6 mb-2">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Complete Dashboard Interface</h3>
                    <div
                      className="bg-white rounded-lg border-2 border-teal-200 flex flex-col items-center justify-center relative overflow-hidden shadow-sm"
                      style={{ minHeight: '500px', maxHeight: '600px' }}
                    >
                      <img
                        src="/dashboard.png"
                        alt="Clinic Dashboard Overview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const placeholder = target.parentElement?.querySelector('.placeholder-dashboard-1') as HTMLElement | null;
                          if (placeholder) placeholder.style.display = 'flex';
                        }}
                      />
                      <div
                        className="placeholder-dashboard-1 absolute inset-0 flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 text-gray-500"
                        style={{ display: 'none' }}
                      >
                        <Building2 className="w-16 h-16 mb-4 text-teal-300" />
                        <p className="text-lg font-medium">Clinic Dashboard Overview</p>
                        <p className="text-sm mt-2">dashboard.png</p>
                      </div>
                    </div>
                  </div>
                  <ul className="list-disc list-inside space-y-3 text-base text-teal-700 mt-4">
                    <li><strong>Sidebar Navigation:</strong> Quick access to all clinic modules (Business Management, HR, Marketing, etc.)</li>
                    <li><strong>Header Bar:</strong> Clinic name, notifications, user profile, and quick actions</li>
                    <li><strong>Main Content Area:</strong> Statistics cards, charts, and activity feeds</li>
                    <li><strong>Responsive Design:</strong> Works seamlessly on desktop, tablet, and mobile</li>

                    {/* <li><strong>Date Filter (Today):</strong> Shows only today's activity — appointments, revenue, and leads for the current day.</li> */}
                    <li><strong>Sample Data (First 2 Days):</strong> New clinics see realistic demo data for 2 days to explore the dashboard before real data is added.</li>
                  </ul>
                  <div className="mt-4 p-4 bg-white rounded-lg border border-teal-200">
                    <p className="text-sm text-teal-700"><strong>💡 Pro Tip:</strong> Use the sidebar to quickly navigate between different modules without returning to the main dashboard.</p>
                  </div>
                </div>
              </div>

              {/* Steps 2–6 Process Flow */}
              <div className="relative">
                {/* Vertical connecting line */}
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 via-purple-300 via-green-300 via-amber-300 to-teal-300" style={{ zIndex: 0 }} />

                {/* Step 2: Key Statistics Cards */}
                <div className="relative flex gap-6 mb-8" style={{ zIndex: 1 }}>
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <span className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full text-base font-bold shadow-md ring-4 ring-blue-100">2</span>
                  </div>
                  <div className="flex-1 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
                    <h4 className="font-bold text-lg text-blue-900 mb-1">Key Statistics Cards</h4>
                    <p className="text-sm text-blue-700 mb-4">Six cards at the top show your most important numbers at a glance:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { label: "Total Reviews", icon: "⭐", desc: "Patient ratings received", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
                        { label: "Total Enquiries", icon: "💬", desc: "Inquiries from patients", color: "text-blue-600 bg-blue-50 border-blue-200" },
                        { label: "Appointments", icon: "📅", desc: "All scheduled visits", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
                        { label: "Total Leads", icon: "🎯", desc: "Potential new patients", color: "text-purple-600 bg-purple-50 border-purple-200" },
                        { label: "Total Patients", icon: "👥", desc: "Registered patients count", color: "text-green-600 bg-green-50 border-green-200" },
                        { label: "Total Revenue", icon: "💰", desc: "Earnings from services", color: "text-orange-600 bg-orange-50 border-orange-200" },
                      ].map((card) => (
                        <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4">
                          <div className={`text-xl mb-2 w-10 h-10 rounded-lg flex items-center justify-center border ${card.color}`}>{card.icon}</div>
                          <div className="font-semibold text-gray-900 text-sm">{card.label}</div>
                          <div className="text-xs text-gray-500 mt-1">{card.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Step 3: Charts & Analytics Widgets */}
                <div className="relative flex gap-6 mb-8" style={{ zIndex: 1 }}>
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <span className="flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-full text-base font-bold shadow-md ring-4 ring-purple-100">3</span>
                  </div>
                  <div className="flex-1 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-2xl p-6 shadow-sm">
                    <h4 className="font-bold text-lg text-purple-900 mb-1">Charts &amp; Analytics Widgets</h4>
                    <p className="text-sm text-purple-700 mb-4">Nine interactive widgets give you deep insight into clinic performance:</p>
                    <div className="space-y-2">
                      {[
                        { name: "Appointment Status Breakdown", icon: "🥧", desc: "Pie chart: Scheduled, Confirmed, Completed, Cancelled counts" },
                        { name: "Lead Analytics", icon: "📊", desc: "Bar chart: New, Contacted, Qualified, Converted, Lost leads" },
                        { name: "Revenue Overview", icon: "📈", desc: "Line/bar chart: revenue trend over selected time period" },
                        { name: "Most Booked Services", icon: "🏆", desc: "Horizontal bar: services ranked by number of bookings" },
                        { name: "Most Purchased Memberships", icon: "💎", desc: "Area chart: membership plan popularity and revenue" },
                        { name: "Top Patients (VIP)", icon: "👑", desc: "Table: highest-spending or most-frequent patients" },
                        { name: "Commission Details", icon: "💼", desc: "Staff-wise: earned vs paid commissions with counts" },
                        { name: "Cancellation Trend", icon: "📉", desc: "Line chart: cancellation and no-show rates week by week" },
                        { name: "Treatment Conversion Rate", icon: "🔄", desc: "Bar chart: leads converted to appointments and treatments" },
                      ].map((widget, i) => (
                        <div key={widget.name} className="flex items-center gap-3 bg-white border border-purple-100 rounded-lg px-4 py-2.5">
                          <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                          <span className="text-lg flex-shrink-0">{widget.icon}</span>
                          <div>
                            <span className="font-semibold text-purple-900 text-sm">{widget.name}</span>
                            <p className="text-xs text-purple-600 mt-0.5">{widget.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Step 4: Date Range Filters */}
                <div className="relative flex gap-6 mb-8" style={{ zIndex: 1 }}>
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <span className="flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-full text-base font-bold shadow-md ring-4 ring-green-100">4</span>
                  </div>
                  <div className="flex-1 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-sm">
                    <h4 className="font-bold text-lg text-green-900 mb-1">Date Range Filters</h4>
                    <p className="text-sm text-green-700 mb-4">All dashboard data updates instantly when you switch between these time ranges:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { step: "Step 1", label: "Today", desc: "Stats for today only", color: "bg-green-50 border-green-300 text-green-800", dot: "bg-green-500" },
                        { step: "Step 2", label: "This Week", desc: "Last 7 days data", color: "bg-blue-50 border-blue-300 text-blue-800", dot: "bg-blue-500" },
                        { step: "Step 3", label: "This Month", desc: "Current month data", color: "bg-purple-50 border-purple-300 text-purple-800", dot: "bg-purple-500" },
                        { step: "Step 4", label: "Overall", desc: "All-time data", color: "bg-orange-50 border-orange-300 text-orange-800", dot: "bg-orange-500" },
                      ].map((filter) => (
                        <div key={filter.label} className={`border-2 rounded-xl p-4 ${filter.color}`}>
                         
                          <div className="font-bold text-sm">{filter.label}</div>
                          <div className="text-xs mt-1 opacity-80">{filter.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Step 5: Sample Data vs Real Data */}
                <div className="relative flex gap-6 mb-8" style={{ zIndex: 1 }}>
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <span className="flex items-center justify-center w-10 h-10 bg-amber-500 text-white rounded-full text-base font-bold shadow-md ring-4 ring-amber-100">5</span>
                  </div>
                  <div className="flex-1 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
                    <h4 className="font-bold text-lg text-amber-900 mb-1">Sample Data vs Real Data</h4>
                    <p className="text-sm text-amber-700 mb-4">When you first register, the system shows sample/demo data for 2 days. Here's the transition process:</p>
                    <div className="flex flex-col md:flex-row gap-2 items-stretch">
                      {/* Step A */}
                      <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">A</span>
                          <span className="font-semibold text-blue-900 text-sm">Days 1–2 · Sample Data Active</span>
                        </div>
                        <p className="text-xs text-blue-700">Realistic demo data fills all dashboard sections so you can explore the platform before your own data appears.</p>
                      </div>
                      {/* Arrow */}
                      <div className="hidden md:flex items-center text-amber-400 text-2xl px-1">→</div>
                      {/* Step B */}
                      <div className="flex-1 bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">B</span>
                          <span className="font-semibold text-green-900 text-sm">Real Activity · Data Switches</span>
                        </div>
                        <p className="text-xs text-green-700">The moment you add a patient, appointment, lead, or billing — the system switches to your real data immediately.</p>
                      </div>
                      {/* Arrow */}
                      <div className="hidden md:flex items-center text-amber-400 text-2xl px-1">→</div>
                      {/* Step C */}
                      <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">C</span>
                          <span className="font-semibold text-gray-900 text-sm">After Day 2 · Demo Removed</span>
                        </div>
                        <p className="text-xs text-gray-600">Sample data disappears. If no real activity exists yet, sections appear empty until you start using the platform.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 6: Quick Tips */}
                <div className="relative flex gap-6" style={{ zIndex: 1 }}>
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <span className="flex items-center justify-center w-10 h-10 bg-teal-600 text-white rounded-full text-base font-bold shadow-md ring-4 ring-teal-100">6</span>
                  </div>
                  <div className="flex-1 bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-2xl p-6 shadow-sm">
                    <h4 className="font-bold text-lg text-teal-900 mb-1">Quick Tips</h4>
                    <p className="text-sm text-teal-700 mb-4">Follow these tips to get the most out of your dashboard:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        { num: 1, tip: "Use 'Overall' filter to see your clinic's complete performance history." },
                        { num: 2, tip: "Revenue widgets update in real time as appointments are billed." },
                        { num: 3, tip: "Lead Analytics help you identify which lead stages need more attention." },
                        { num: 4, tip: "Cancellation Trend helps you reduce no-shows with targeted reminders." },
                        { num: 5, tip: "Commission Details ensure your staff payouts are transparent and accurate." },
                        { num: 6, tip: "Top Patients widget helps you identify and retain your VIP patients." },
                      ].map(({ num, tip }) => (
                        <div key={num} className="flex items-start gap-3 bg-white border border-teal-100 rounded-lg px-4 py-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">{num}</span>
                          <p className="text-sm text-teal-900">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );

      case "health-center":
        // Array of images for the slideshow
        const images = ["/image.png", "/manage.png"];
        
        const nextImage = () => {
          setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        };
        
        const prevImage = () => {
          setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
        };
        
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
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4 h-full flex flex-col">
                  <h4 className="font-semibold text-gray-800 mb-3">Profile Management:</h4>
                  <ul className="space-y-2 text-gray-700 flex-grow">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Update clinic name and description
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Modify contact information
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Adjust pricing and timings
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Update services offered
                    </li>
                  </ul>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4 h-full flex flex-col">
                  <h4 className="font-semibold text-gray-800 mb-3">Profile Features:</h4>
                  <ul className="space-y-2 text-gray-700 flex-grow">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Manage clinic images and branding
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Update working hours and availability
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Customize clinic specialties
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Manage clinic certifications
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Manage Health Center Screenshot</h4>
                <div className="border-2 border-gray-300 rounded-lg min-h-[400px] overflow-hidden bg-white relative">
                  <div className="relative h-[400px] overflow-hidden">
                    <img 
                      src={images[currentImageIndex]} 
                      alt="Manage Health Center" 
                      className="w-full h-full object-contain p-4"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-full h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <Building2 className="w-12 h-12 mx-auto mb-2" />
                        <p>Profile management interface</p>
                        <p className="text-sm">(Image will appear here)</p>
                      </div>
                    </div>
                  </div>
                  <button 
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      prevImage();
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button 
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      nextImage();
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "create-agent":
        // Array of images for the slideshow
        const agentImages = ["/team.png", "/team1.png"];
        
        const nextAgentImage = () => {
          setCurrentImageIndex((prevIndex) => (prevIndex + 1) % agentImages.length);
        };
        
        const prevAgentImage = () => {
          setCurrentImageIndex((prevIndex) => (prevIndex - 1 + agentImages.length) % agentImages.length);
        };
        
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
                  <div className="border-2 border-gray-300 rounded-lg h-full min-h-[400px] overflow-hidden bg-white relative">
                    <div className="relative h-[400px] overflow-hidden">
                      <img 
                        src={agentImages[currentImageIndex]} 
                        alt="Agent Creation Form" 
                        className="w-full h-full object-contain p-4"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden w-full h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <Users className="w-16 h-16 mx-auto mb-2" />
                          <p>Agent creation interface screenshot</p>
                          <p className="text-sm">(Image will appear here)</p>
                        </div>
                      </div>
                    </div>
                    <button 
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        prevAgentImage();
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button 
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        nextAgentImage();
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
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
                <div className="border-2 border-gray-300 rounded-lg min-h-[400px] overflow-hidden bg-white relative">
                  <div className="relative h-[400px] overflow-hidden">
                    <img 
                      src={agentImages[currentImageIndex]} 
                      alt="Agent Creation Form" 
                      className="w-full h-full object-contain p-4"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-full h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <Users className="w-16 h-16 mx-auto mb-2" />
                        <p>Agent creation interface screenshot</p>
                        <p className="text-sm">(Image will appear here)</p>
                      </div>
                    </div>
                  </div>
                  <button 
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      prevAgentImage();
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button 
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      nextAgentImage();
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "service-setup":
        return <ServicesGuide />;

      case "setup-operation":
        return <SetupOperationGuide />;


      case "patients-appointments":
        if (selectedSubItem === "book-appointments") {
          return <BookAppointmentWorkflowGuide />;
        }
        if (selectedSubItem === "scheduled-appointments") {
          return <ScheduledAppointmentsWorkflowGuide />;
        }
        if (selectedSubItem === "patient-registration") {
          return <PatientRegistrationWorkflowGuide />;
        }
        if (selectedSubItem === "patient-information") {
          return <ClinicManagementGuide />;
        }
        if (selectedSubItem === "complaints") {
          return <ComplaintWorkflowGuide />;
        }

        return (
          <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="text-center mb-8">
              <Calendar className="w-16 h-16 text-teal-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Patients & Appointments</h2>
              <p className="text-gray-600">Select a section from the sidebar to view detailed workflow</p>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-8 rounded-r-lg shadow-sm">
              <div className="flex items-start gap-4">
                <BookOpen className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Available Topics:</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm text-blue-700 mt-4">
                    <li><strong>Book Appointments:</strong> Interactive scheduler and booking flow.</li>
                    <li><strong>Scheduled Appointments:</strong> Manage visits and record vital signs.</li>
                    <li><strong>Patient Registration:</strong> Process for onboarding new patients.</li>
                    <li><strong>Complaints:</strong> Record medical complaints and progress notes.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );


      case "stock-management":
        if (selectedSubItem === "locations") {
          return <LocationsGuide />;
        }
        if (selectedSubItem === "suppliers") {
          return <SuppliersGuide />;
        }
        if (selectedSubItem === "uom") {
          return <UOMGuide />;
        }
        if (selectedSubItem === "purchase-requests") {
          return <PurchaseRequestsGuide />;
        }
        if (selectedSubItem === "purchase-orders") {
          return <PurchaseOrdersGuide />;
        }
        if (selectedSubItem === "grn") {
          return <GRNGuide />;
        }
        if (selectedSubItem === "purchase-invoices") {
          return <PurchaseInvoicesGuide />;
        }
        if (selectedSubItem === "purchase-returns") {
          return <PurchaseReturnsGuide />;
        }
        if (selectedSubItem === "stock-adjustment") {
          return <StockAdjustmentGuide />;
        }
        if (selectedSubItem === "transfer-requests") {
          return <TransferRequestsGuide />;
        }
        if (selectedSubItem === "transfer-stock") {
          return <TransferStockGuide />;
        }
        if (selectedSubItem === "material-activity") {
          return <MaterialActivityGuide />;
        }
        if (selectedSubItem === "consumptions") {
          return <ConsumptionsGuide />;
        }
        if (selectedSubItem === "allocated-stock") {
          return <AllocatedStockGuide />;
        }
        
        return (
          <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="text-center mb-8">
              <ClipboardList className="w-16 h-16 text-teal-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Stock Management</h2>
              <p className="text-gray-600">Select a Section</p>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-8 rounded-r-lg shadow-sm">
              <div className="flex items-start gap-4">
                <BookOpen className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Choose a stock management section from the navigation to get started</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm text-blue-700 mt-4">
                    <li>Locations - Manage storage areas and warehouses</li>
                    <li>Suppliers - Vendor database and performance tracking</li>
                    <li>UOM - Units of measurement configuration</li>
                    <li>Purchase Requests - Internal requisition workflow</li>
                    <li>Purchase Orders - Formal supplier orders</li>
                    <li>GRN - Goods received note and delivery verification</li>
                    <li>Purchase Invoices - Invoice processing and payments</li>
                    <li>Purchase Returns - Return defective items to suppliers</li>
                    <li>Stock Qty Adjustment - Correct inventory discrepancies</li>
                    <li>Stock Transfer Requests - Request inter-location transfers</li>
                    <li>Transfer Stock - Execute approved stock transfers</li>
                    <li>Material Activity - Track all stock movements</li>
                    <li>Consumptions - Record treatment material usage</li>
                    <li>Allocated Stock Items - Reserve inventory for appointments</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case "reports-analytics":
        if (selectedSubItem === "petty-cash") {
          return <PettyCashWorkflowGuide />;
        }
        if (selectedSubItem === "reports") {
          return <ReportsAnalyticsWorkflowGuide />;
        }
        
        return (
          <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="text-center mb-8">
              <ClipboardList className="w-16 h-16 text-teal-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h2>
              <p className="text-gray-600">Select a Section</p>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-8 rounded-r-lg shadow-sm">
              <div className="flex items-start gap-4">
                <BookOpen className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Choose a reports section from the navigation to get started</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm text-blue-700 mt-4">
                    <li>Petty Cash - Track cash transactions and manual entries</li>
                    <li>Reports - Comprehensive analytics across all clinic operations</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case "security-privacy":
        return <SecurityPrivacyWorkflowGuide />;

      case "policy-compliance":
        return <PolicyComplianceGuide />;

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
        <div className="w-full px-2 sm:px-4 lg:px-6 py-2 sm:py-4 h-full">
          {/* Header */}
          <div className="mb-4 sm:mb-6 px-2 sm:px-4 lg:px-6 pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Clinic Workflow Guide</h1>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2">Complete step-by-step documentation for clinic operations</p>
              </div>
              <Link 
                href="/"
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm sm:text-base"
              >
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                Back to Zeva
              </Link>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-0 h-full">
            {/* Sidebar Navigation - Hidden on mobile, shown on lg+ */}
            <div className="lg:w-72 xl:w-80 flex-shrink-0 w-full lg:block hidden">
              <div className="bg-white rounded-none shadow-none border-r border-gray-200 h-full flex flex-col lg:max-h-[calc(100vh-120px)] sticky top-0">
                <div className="p-3 sm:p-4 border-b border-gray-200 bg-white">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">Workflow Sections</h2>
                </div>
                <nav className="p-2 sm:p-3 flex-1 overflow-y-auto">
                  <ul className="space-y-1">
                    {workflowSections.map((section) => {
                      const isExpandable = section.children && section.children.length > 0;
                      const isExpanded = expandedModules.includes(section.id);
                      const isActive = activeSection === section.id;
                      
                      return (
                        <li key={section.id}>
                          <div className="space-y-1">
                            <button
                              onClick={() => {
                                setActiveSection(section.id);
                                if (isExpandable) {
                                  toggleModule(section.id);
                                }
                              }}
                              className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-md flex items-center gap-2 sm:gap-2.5 transition-colors text-xs sm:text-sm ${
                                isActive
                                  ? "bg-teal-50 text-teal-700 border border-teal-200"
                                  : "text-gray-700 hover:bg-gray-50 border border-transparent"
                              }`}
                            >
                              <span className={`${isActive ? "text-teal-600" : "text-gray-500"} text-sm sm:text-base`}>
                                {section.icon}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-xs sm:text-sm truncate">{section.title}</div>
                                {section.description && (
                                  <div className="text-[10px] sm:text-xs text-gray-500 line-clamp-1 mt-0.5 hidden sm:block">{section.description}</div>
                                )}
                              </div>
                              {isExpandable && (
                                <ChevronDown
                                  className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 flex-shrink-0 ${
                                    isExpanded ? "rotate-180 text-teal-600" : "text-gray-400"
                                  }`}
                                />
                              )}
                            </button>
                            
                            {/* Sub-items (dropdown) */}
                            {isExpandable && isExpanded && section.children && (
                              <div className="ml-4 sm:ml-6 space-y-0.5 animate-in slide-in-from-top-2 duration-200">
                                {section.children.map((child) => (
                                  <button
                                    key={child.id}
                                    onClick={() => {
                                      setActiveSection(section.id);
                                      setSelectedSubItem(child.id);
                                    }}
                                    className={`w-full flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-[10px] sm:text-xs transition-all ${
                                      selectedSubItem === child.id
                                        ? "bg-teal-100 text-teal-800 border border-teal-200"
                                        : "text-gray-600 hover:bg-gray-100 border border-transparent"
                                    }`}
                                  >
                                    <span className="text-xs sm:text-sm">{child.icon}</span>
                                    <span className="font-medium truncate">{child.label}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-none shadow-none border-l border-gray-200 h-full">
                <div className="p-4 sm:p-6 lg:p-8 xl:p-10 h-full overflow-y-auto">
                  {renderSectionContent()}
                </div>
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
