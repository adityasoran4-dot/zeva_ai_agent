"use client";
import React from 'react';
import { Star, Users } from 'lucide-react';

const ReviewsGuide: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header Section */}
      <div className="flex items-center gap-3 mb-8">
        <Star className="w-10 h-10 text-yellow-600" />
        <h2 className="text-3xl font-bold text-gray-900">Reviews Management - Workflow Guide</h2>
      </div>
      
      <div className="prose max-w-none space-y-8">
        {/* Overview Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-600" />
              Overview - Patient Reviews & Ratings
            </h3>
          </div>
          
          <div className="p-6">
            {/* Image Placeholder */}
            <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Reviews Management Dashboard
              </h3>
              <div className="bg-white rounded-lg border-2 border-yellow-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
                <img 
                  src="/review.png" 
                  alt="Reviews Management Dashboard" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.querySelector('.placeholder-reviews')?.classList.remove('hidden');
                  }}
                />
                <div className="placeholder-reviews hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-yellow-50 to-amber-50 text-gray-500">
                  <Star className="w-16 h-16 mb-4 text-yellow-300" />
                  <p className="text-lg font-medium">Reviews Management Dashboard</p>
                  <p className="text-sm mt-2">Screenshot will appear here</p>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-4">
              <p className="text-base text-gray-700 leading-relaxed">
                The Reviews Management module allows you to monitor, manage, and respond to patient 
                reviews and ratings across multiple platforms. Build trust, improve your clinic's 
                reputation, and gain valuable insights from patient feedback all in one centralized dashboard.
              </p>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">Key Features:</h4>
                <ul className="space-y-2 text-sm text-yellow-800">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span><strong>Multi-Platform Integration:</strong> View reviews from Google, Facebook, Healthgrades, and other healthcare review sites</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span><strong>Real-time Monitoring:</strong> Get instant notifications when new reviews are posted</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span><strong>Response Management:</strong> Reply directly to reviews from the dashboard to show you care</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span><strong>Rating Analytics:</strong> Track average ratings, trends over time, and performance metrics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span><strong>Sentiment Analysis:</strong> Automatically categorize reviews as positive, neutral, or negative</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span><strong>Review Requests:</strong> Send automated review requests to patients after appointments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span><strong>Filtering & Search:</strong> Find specific reviews by date, rating, platform, or keywords</span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Why Reviews Matter:</h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-blue-800">
                  <li>94% of patients read online reviews before choosing a healthcare provider</li>
                  <li>High ratings increase appointment bookings by up to 30%</li>
                  <li>Responding to reviews shows you value patient feedback</li>
                  <li>Negative reviews provide opportunities for improvement</li>
                  <li>Positive reviews build credibility and attract new patients</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* What You Can See Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-green-600" />
              What You Can See in Reviews Section
            </h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <p className="text-base text-gray-700 leading-relaxed">
                The Reviews section provides comprehensive visibility into all patient feedback 
                across different platforms. Here's everything you can access and monitor:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Review Details
                  </h4>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span><strong>Patient Name:</strong> Who wrote the review (if provided)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span><strong>Star Rating:</strong> 1-5 star rating given by patient</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span><strong>Review Text:</strong> Complete written feedback and comments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span><strong>Date Posted:</strong> When the review was published</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span><strong>Platform Source:</strong> Google, Facebook, Healthgrades, etc.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span><strong>Verification Status:</strong> Verified patient or anonymous</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <h4 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Analytics & Metrics
                  </h4>
                  <ul className="space-y-2 text-sm text-emerald-800">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 mt-0.5">•</span>
                      <span><strong>Average Rating:</strong> Overall clinic rating across all platforms</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 mt-0.5">•</span>
                      <span><strong>Total Reviews:</strong> Number of reviews received</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 mt-0.5">•</span>
                      <span><strong>Rating Distribution:</strong> Breakdown of 5-star, 4-star, etc.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 mt-0.5">•</span>
                      <span><strong>Trend Graphs:</strong> Rating changes over weeks/months</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 mt-0.5">•</span>
                      <span><strong>Response Rate:</strong> Percentage of reviews you've replied to</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 mt-0.5">•</span>
                      <span><strong>Sentiment Score:</strong> Positive vs negative review ratio</span>
                    </li>
                  </ul>
                </div>
              </div>

            

              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                <p className="text-sm text-orange-800">
                  <strong>Best Practice:</strong> Respond to all reviews within 24-48 hours. Thank patients for positive reviews and address concerns professionally in negative reviews. This shows prospective patients that you value feedback and are committed to quality care.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How to Use Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How to Use Reviews Management
            </h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Navigate to Reviews Section</p>
                    <p className="text-sm text-gray-700">Go to Marketing → Reviews in the sidebar navigation to access the reviews dashboard.</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">View All Reviews</p>
                    <p className="text-sm text-gray-700">See complete list of reviews from all connected platforms. Each review shows patient name, star rating, review text, date, and source platform.</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Filter & Sort Reviews</p>
                    <p className="text-sm text-gray-700">Use filters to view reviews by rating (1-5 stars), platform (Google, Facebook, etc.), date range, or sentiment (positive/negative). Sort by newest, oldest, highest rating, or lowest rating.</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Read Review Details</p>
                    <p className="text-sm text-gray-700">Click on any review to see full details including patient information, complete review text, photos (if attached), and previous responses from your clinic.</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Respond to Reviews</p>
                    <p className="text-sm text-gray-700">Click "Reply" button to write a response. For positive reviews, thank the patient. For negative reviews, acknowledge concerns and offer to discuss offline. Keep responses professional and HIPAA-compliant.</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">6</span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Monitor Analytics</p>
                    <p className="text-sm text-gray-700">Check the analytics dashboard to see average ratings, total reviews, rating trends over time, and response rates. Use this data to identify areas for improvement.</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">7</span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Request New Reviews</p>
                    <p className="text-sm text-gray-700">Send automated review requests to patients after their appointments. Set up templates and scheduling to encourage more patients to leave feedback.</p>
                  </div>
                </li>
              </ol>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-green-900 mb-2">Tips for Effective Review Management:</h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-green-800">
                  <li>Respond to ALL reviews, not just negative ones</li>
                  <li>Keep responses personalized and authentic</li>
                  <li>Never share patient medical information in public responses</li>
                  <li>Address negative feedback constructively and offer solutions</li>
                  <li>Thank patients by name in positive review responses</li>
                  <li>Monitor reviews daily to stay on top of new feedback</li>
                  <li>Use negative reviews as learning opportunities to improve services</li>
                  <li>Encourage satisfied patients to leave reviews through follow-up emails</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewsGuide;
