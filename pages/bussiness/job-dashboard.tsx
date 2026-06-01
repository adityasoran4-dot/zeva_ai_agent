import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
import Head from "next/head";
import Header from "../../components/Header";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function JobDashboardPage(): ReactElement {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const images = [
    "/job1.png",
    "/jobimage.png"
  ];
  
  const goToPrevious = () => {
    setCurrentImageIndex((prev: number) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  
  const goToNext = () => {
    setCurrentImageIndex((prev: number) => (prev === images.length - 1 ? 0 : prev + 1));
  };
  
  return (
    <>
      <Head>
        <title>ZEVA | Job Dashboard</title>
        <meta
          name="description"
          content="Explore our job dashboard and learn how the hiring process works at ZEVA."
        />
      </Head>

      <Header />
      <div className="pt-20">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Job Dashboard
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover how our comprehensive job management system helps you find the right talent and streamline your hiring process
            </p>
          </div>

          {/* Dashboard Screenshot Section */}
          <div className="mb-16">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Our Job Dashboard Interface
              </h2>
              
              <div className="flex justify-center mb-8">
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden shadow-xl max-w-4xl w-full relative group">
                  <img 
                    src={images[currentImageIndex]} 
                    alt={`Job Dashboard Screenshot ${currentImageIndex + 1}`} 
                    className="w-full h-auto"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-dashboard.png';
                    }}
                  />
                  
                  {/* Navigation Controls */}
                  <button 
                    onClick={goToPrevious}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  
                  <button 
                    onClick={goToNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                  
                  
                  
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  This is a visual representation of our job management dashboard
                </p>
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Screenshot for demonstration purposes
                </div>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              How Our Job Section Works
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Job Postings</h3>
                <p className="text-gray-600">
                  Create detailed job listings with requirements, responsibilities, and compensation information. Our intuitive form makes posting jobs quick and professional.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Applicant Tracking</h3>
                <p className="text-gray-600">
                  Manage all applications in one place. Track candidate progress through different stages, from application received to final hiring decision.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Interview Scheduling</h3>
                <p className="text-gray-600">
                  Coordinate interviews efficiently with built-in calendar integration. Send automated invitations and reminders to candidates and interviewers.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Offer Management</h3>
                <p className="text-gray-600">
                  Create and send professional job offers. Track acceptance status and manage onboarding processes seamlessly from offer to employment.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Analytics & Reporting</h3>
                <p className="text-gray-600">
                  Get insights into your hiring metrics. Track time-to-hire, source effectiveness, and team performance with comprehensive reporting tools.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Team Collaboration</h3>
                <p className="text-gray-600">
                  Collaborate with your team on hiring decisions. Share notes, rate candidates, and make informed decisions together with built-in communication tools.
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white mb-16">
            <h2 className="text-2xl font-bold mb-4">Ready to Streamline Your Hiring?</h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Join thousands of companies using our job management platform to find top talent and build amazing teams.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors">
                Get Started Today
              </button>
              <button className="bg-blue-700 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-800 transition-colors border border-white border-opacity-20">
                Schedule a Demo
              </button>
            </div>
          </div>

          {/* Additional Features Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Advanced Features
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Integration Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Seamless Integration
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Connect with popular HR platforms and job boards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Sync with your existing calendar and email systems</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>API access for custom integrations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Single sign-on (SSO) capabilities</span>
                  </li>
                </ul>
              </div>

              {/* Security Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Enterprise Security
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Bank-level encryption for all data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Regular security audits and compliance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>GDPR and HIPAA compliant</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Role-based access control</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Testimonials Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              What Our Users Say
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-3">
                    JD
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">John Doe</h4>
                    <p className="text-sm text-gray-600">HR Manager, TechCorp</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">
                  "This platform has completely transformed our hiring process. We've reduced our time-to-hire by 60% and improved candidate quality significantly."
                </p>
                <div className="flex mt-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold mr-3">
                    SA
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Sarah Anderson</h4>
                    <p className="text-sm text-gray-600">Recruiting Director, HealthPlus</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">
                  "The analytics dashboard gives us incredible insights into our hiring funnel. We can now make data-driven decisions and optimize our recruitment strategy."
                </p>
                <div className="flex mt-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold mr-3">
                    MR
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Mike Roberts</h4>
                    <p className="text-sm text-gray-600">Startup Founder, InnovateX</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">
                  "As a small team, we needed something powerful yet simple. This platform gave us enterprise-level hiring tools without the complexity or cost."
                </p>
                <div className="flex mt-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-gray-50 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  How long does it take to set up the job dashboard?
                </h3>
                <p className="text-gray-600">
                  Most teams can be up and running within 24-48 hours. Our onboarding team provides personalized setup assistance and training to ensure a smooth transition.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Can I customize the application process?
                </h3>
                <p className="text-gray-600">
                  Yes, our platform offers extensive customization options. You can create custom application forms, set up automated workflows, and tailor the candidate experience to match your brand.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  What kind of support do you provide?
                </h3>
                <p className="text-gray-600">
                  We offer 24/7 customer support through chat, email, and phone. Additionally, we provide comprehensive documentation, video tutorials, and regular webinars to help you maximize the platform's potential.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Is there a mobile app available?
                </h3>
                <p className="text-gray-600">
                  Yes, we offer fully responsive mobile applications for both iOS and Android. Recruiters can manage applications, schedule interviews, and communicate with candidates on the go.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Opt out of the global header/footer layout for a clean page.
JobDashboardPage.getLayout = (page: ReactNode) => page;