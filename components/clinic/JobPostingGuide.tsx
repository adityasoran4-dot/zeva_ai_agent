"use client";
import React from 'react';
import { Briefcase, Plus, Eye } from 'lucide-react';

const JobPostingGuide: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header Section */}
      <div className="flex items-center gap-3 mb-8">
        <Briefcase className="w-10 h-10 text-teal-600" />
        <h2 className="text-3xl font-bold text-gray-900">Job Posting - Workflow Guide</h2>
      </div>
      
      <div className="prose max-w-none space-y-8">
        {/* Overview Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-blue-600" />
              Overview
            </h3>
          </div>
          
          <div className="p-6">
            {/* Image Placeholder */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Job Management Dashboard Overview
              </h3>
              <div className="bg-white rounded-lg border-2 border-blue-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                <img 
                  src="/job.png" 
                  alt="Job Management Overview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.querySelector('.placeholder-job-mgmt')?.classList.remove('hidden');
                  }}
                />
                <div className="placeholder-job-mgmt hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-500">
                  <Briefcase className="w-16 h-16 mb-4 text-blue-300" />
                  <p className="text-lg font-medium">Job Management Dashboard</p>
                  <p className="text-sm mt-2">Screenshot will appear here</p>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-4">
              <p className="text-base text-gray-700 leading-relaxed">
                The Job Posting module provides a comprehensive overview of all job-related activities 
                within your clinic. From creating new positions to managing applications, this system 
                streamlines your entire recruitment workflow in one centralized dashboard.
              </p>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Key Features:</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span><strong>Job Creation:</strong> Post new positions with detailed descriptions and requirements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span><strong>Application Management:</strong> Track and review all incoming applications in real-time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span><strong>Candidate Review:</strong> Evaluate qualifications, experience, and fit for your clinic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span><strong>Status Tracking:</strong> Monitor progress from New → Reviewed → Interview → Hired</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span><strong>Powerful Filters:</strong> Filter by status, department, employment type, and date range</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span><strong>Communication Tools:</strong> Contact applicants via email or phone directly</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Create New Job Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Plus className="w-6 h-6 text-green-600" />
              Create New Job
            </h3>
          </div>
          
          <div className="p-6">
            {/* Image Placeholder */}
            <div className="bg-green-50 rounded-xl border border-green-200 p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Create New Job Form
              </h3>
              <div className="bg-white rounded-lg border-2 border-green-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                <img 
                  src="/createjob.png" 
                  alt="Create New Job Form" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.querySelector('.placeholder-create-job')?.classList.remove('hidden');
                  }}
                />
                
                <div className="placeholder-create-job hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 text-gray-500">
                  <Plus className="w-16 h-16 mb-4 text-green-300" />
                  <p className="text-lg font-medium">Create New Job Form</p>
                  <p className="text-sm mt-2">Screenshot will appear here</p>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-4">
              <p className="text-base text-gray-700 leading-relaxed">
                Creating a new job posting is simple and intuitive. Click the "Create New Job" button 
                in the top-right corner of the page to open the job creation form. Fill in all the required 
                details to post your first job opening.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                <h4 className="font-semibold text-green-900 mb-3">Steps to Create a Job Posting:</h4>
                <ol className="space-y-3 text-sm text-green-800">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <div>
                      <strong>Click "Create New Job":</strong> Located in the top-right corner of the Job Management page. This opens the job creation modal with all necessary fields.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <div>
                      <strong>Fill Basic Information:</strong> Enter job title, department, employment type (Full-time/Part-time/Internship), location, and salary range. These are essential details candidates need to see.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <div>
                      <strong>Add Job Description:</strong> Write a detailed description including role overview, key responsibilities, reporting structure, and daily tasks. Be clear and specific about what the role entails.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                    <div>
                      <strong>Specify Requirements:</strong> List required qualifications, degrees, licenses, certifications, years of experience, technical skills, and language proficiency needed for the position.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                    <div>
                      <strong>List Benefits & Perks:</strong> Highlight what makes your clinic attractive - health insurance, housing allowance, transportation, annual airfare, continuing education support, and other perks.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">6</span>
                    <div>
                      <strong>Set Application Details:</strong> Define application deadline, expected start date, and number of positions available. This helps manage candidate expectations.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">7</span>
                    <div>
                      <strong>Review & Submit:</strong> Double-check all information for accuracy, then click "Submit" or "Publish". The job will go live immediately or await admin approval based on your settings.
                    </div>
                  </li>
                </ol>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Tip:</strong> Clear job titles and detailed descriptions attract better candidates. Include salary range for transparency - it increases application rates by up to 30%.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Manage Jobs Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Plus className="w-6 h-6 text-purple-600" />
              Manage Jobs - View, Edit & Preview
            </h3>
          </div>
          
          <div className="p-6">
            {/* Image Placeholder */}
            <div className="bg-purple-50 rounded-xl border border-purple-200 p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Job Management Actions - View, Edit, Preview
              </h3>
              <div className="bg-white rounded-lg border-2 border-purple-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm mb-6" style={{ minHeight: '700px', maxHeight: '800px' }}>
                <img 
                  src="/PREVIEW.png" 
                  alt="Job Management Actions" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.querySelector('.placeholder-job-actions')?.classList.remove('hidden');
                  }}
                />
                
                
                <div className="placeholder-job-actions hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 text-gray-500">
                  <Briefcase className="w-16 h-16 mb-4 text-purple-300" />
                  <p className="text-lg font-medium">View, Edit, Preview Actions</p>
                  <p className="text-sm mt-2">Screenshot will appear here</p>
                </div>
              </div>

              {/* Second Image Div */}
              <div className="bg-white rounded-lg border-2 border-purple-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                <img 
                  src="/edit2.png" 
                  alt="Job Edit and Unpublish Actions" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.querySelector('.placeholder-job-edit')?.classList.remove('hidden');
                  }}
                />
                
                <div className="placeholder-job-edit hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 text-gray-500">
                  <Briefcase className="w-16 h-16 mb-4 text-purple-300" />
                  <p className="text-lg font-medium">Edit and Unpublish Actions</p>
                  <p className="text-sm mt-2">Screenshot will appear here</p>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-4">
              <p className="text-base text-gray-700 leading-relaxed">
                The job management interface provides powerful action buttons on each job card, 
                allowing you to efficiently manage and review your job postings. These key actions 
                help you maintain accurate, up-to-date listings and ensure candidates see the right information.
              </p>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
                <h4 className="font-semibold text-purple-900 mb-3">Key Action Buttons Explained:</h4>
                <ol className="space-y-3 text-sm text-purple-800">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <div>
                      <strong>Preview Button:</strong> Opens public-facing view of the job posting. Shows complete job description, requirements, and benefits as candidates see them. Use before publishing, after editing, or to verify live postings.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <div>
                      <strong>Edit Button:</strong> Update and modify job details anytime. Change title, description, requirements, salary, location, or deadline. Changes save immediately and reflect on live posting.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <div>
                      <strong>Unpublish Button:</strong> Temporarily hide job without deleting. Makes job invisible to candidates but preserves all data and existing applications. Can be republished anytime.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                    <div>
                      <strong>Delete Button:</strong> Permanently remove job posting (irreversible!). Use with extreme caution - typically for test posts, duplicates, or permanently cancelled positions. Consider unpublishing instead if unsure.
                    </div>
                  </li>
                </ol>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Best Practice:</strong> Always preview before publishing to catch errors. Use unpublish instead of delete when temporarily pausing recruitment to preserve data.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Organize Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Eye className="w-6 h-6 text-orange-600" />
              Filter & Organize - All Jobs and Applications
            </h3>
          </div>
          
          <div className="p-6">
            {/* Image Placeholder */}
            <div className="bg-orange-50 rounded-xl border border-orange-200 p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Filter & Organize Interface
              </h3>
              <div className="bg-white rounded-lg border-2 border-orange-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                <img 
                  src="/jobapp.png" 
                  alt="Filter and Organize Jobs" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.querySelector('.placeholder-filter')?.classList.remove('hidden');
                  }}
                />
                <div className="placeholder-filter hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 text-gray-500">
                  <Eye className="w-16 h-16 mb-4 text-orange-300" />
                  <p className="text-lg font-medium">Filter & Organize Interface</p>
                  <p className="text-sm mt-2">Screenshot will appear here</p>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-4">
              <p className="text-base text-gray-700 leading-relaxed">
                Both the "All Jobs" and "Job Applications" sections provide powerful filtering 
                and sorting capabilities to help you quickly find and manage specific job details. 
                These filters make it easy to organize large volumes of jobs and applications efficiently.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Filtering in All Jobs
                  </h4>
                  <ul className="space-y-2 text-sm text-orange-800">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 mt-0.5">•</span>
                      <span><strong>Status:</strong> Active, Inactive, Pending, Approved, Declined</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 mt-0.5">•</span>
                      <span><strong>Employment Type:</strong> Full-time, Part-time, Internship, Contract</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 mt-0.5">•</span>
                      <span><strong>Department:</strong> Dental, Cardiology, Orthopedics, etc.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 mt-0.5">•</span>
                      <span><strong>Date Range:</strong> Last 7 days, 30 days, 3 months, custom</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 mt-0.5">•</span>
                      <span><strong>Search:</strong> By job title, clinic name, or department</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Filtering in Job Applications
                  </h4>
                  <ul className="space-y-2 text-sm text-amber-800">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span><strong>Quick Tabs:</strong> All, Full-Time, Part-Time, Internship</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span><strong>Status:</strong> New, Reviewed, Shortlisted, Interview, Hired, Rejected</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span><strong>Advanced:</strong> By job position, department, experience level</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span><strong>Search:</strong> By candidate name, email, phone, qualifications</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span><strong>Sort Options:</strong> By date, name, experience, rating, status</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">How to Use Filters Effectively:</h4>
                <p className="text-sm text-blue-800">
                  Combine multiple filters (status + department + date range) for precise results. Start broad, then narrow down. Use quick tabs first in applications, then apply advanced filters. Clear filters when done to see complete list again.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobPostingGuide;
