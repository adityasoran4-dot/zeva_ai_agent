import React from 'react';
import Head from 'next/head';
import { Calendar, Heart, Baby, Target, ChevronRight, Clock, TrendingUp, Flower } from 'lucide-react';
import L1 from '../../../components/Layout';

const PregnancyOvulationPage = () => {
  const navigateToTrackPeriods = () => {
    window.location.href = '/calculator/pregnancy-and-ovulation/trackperiods';
  };

  const navigateToTrackPregnancy = () => {
    window.location.href = '/calculator/pregnancy-and-ovulation/pregnancy';
  };

  return (
    <>
      <Head>
        {/* Schema Markup - Pregnancy & Periods Tracker WebPage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["WebPage", "MedicalWebPage"],
              "name": "Pregnancy & Periods Tracker",
              "url": "https://zeva360.com/calculator/pregnancy-and-ovulation/pregnancy&ovulation",
              "description": "ZEVA Pregnancy & Periods Tracker helps women track menstrual cycles, predict ovulation, and monitor pregnancy milestones with accurate, personalized insights in a secure and easy-to-use platform.",
              "isPartOf": {
                "@type": "WebSite",
                "name": "ZEVA",
                "url": "https://zeva360.com"
              },
              "publisher": {
                "@type": "Organization",
                "name": "ZEVA",
                "url": "https://zeva360.com",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://zeva360.com/logo.png"
                }
              },
              "mainEntity": {
                "@type": "SoftwareApplication",
                "name": "Pregnancy & Periods Tracker",
                "applicationCategory": "HealthApplication",
                "operatingSystem": "Web",
                "description": "A free women's health tracking tool to monitor menstrual cycles, estimate ovulation windows, and follow week-by-week pregnancy development with health tips and reminders.",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD"
                }
              }
            })
          }}
        />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Hero Section with Background Image */}
      <div className="relative overflow-hidden">
        {/* Background with subtle pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-600/10 to-purple-600/10"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-20 h-20 bg-pink-300/30 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-purple-300/30 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-indigo-300/30 rounded-full blur-xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="flex justify-center lg:justify-start mb-6">
                <div className="p-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full shadow-lg">
                  <Heart className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                ZEVA Women&apos;s Health
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
                  Tracking Hub
                </span>
              </h1>

              <p className="text-xl text-gray-600 max-w-3xl mx-auto lg:mx-0 leading-relaxed">
              Take control of your reproductive health with ZEVA’s Women’s Health Tracking Hub, designed to support you at every stage of your journey. Our intelligent tracking tools help you monitor menstrual cycles, predict ovulation, and track pregnancy milestones with accuracy, care, and confidence.
              </p>
            </div>
            
            {/* Hero Image */}
            <div className="relative">
              <div className="relative w-full h-96 bg-gradient-to-br from-pink-200/50 to-purple-200/50 rounded-3xl overflow-hidden shadow-2xl">
                {/* Decorative elements to represent health/wellness */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-64 h-64 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                    <div className="absolute inset-4 bg-gradient-to-br from-pink-400/30 to-purple-400/30 rounded-full flex items-center justify-center">
                      <div className="w-32 h-32 bg-white/40 rounded-full flex items-center justify-center">
                        <Flower className="h-16 w-16 text-pink-500" />
                      </div>
                    </div>
                    {/* Floating elements */}
                    <div className="absolute -top-2 left-8 w-4 h-4 bg-pink-400 rounded-full animate-pulse"></div>
                    <div className="absolute top-8 -right-2 w-6 h-6 bg-purple-400 rounded-full animate-pulse delay-300"></div>
                    <div className="absolute -bottom-2 right-8 w-5 h-5 bg-indigo-400 rounded-full animate-pulse delay-700"></div>
                    <div className="absolute bottom-8 -left-2 w-3 h-3 bg-rose-400 rounded-full animate-pulse delay-1000"></div>
                  </div>
                </div>
              </div>
              {/* Decorative corner elements */}
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-pink-400/60 rounded-full"></div>
              <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-purple-400/60 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Feature Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center border border-pink-100 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">95% Accuracy</h3>
            <p className="text-gray-600 text-sm">Precise cycle predictions</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center border border-purple-100 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Real-time</h3>
            <p className="text-gray-600 text-sm">Instant insights</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center border border-indigo-100 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Personalized</h3>
            <p className="text-gray-600 text-sm">Tailored to your body</p>
          </div>
        </div>

        {/* Main Tracking Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Period Tracking Card */}
          <div
            className="group relative overflow-hidden bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2"
            onClick={navigateToTrackPeriods}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-rose-500/5"></div>
            <div className="relative p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Period Tracker</h2>
                    <p className="text-pink-600 font-medium">Monitor Your Cycle</p>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-gray-400 group-hover:text-pink-500 group-hover:translate-x-1 transition-all duration-300" />
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  <span className="text-gray-700">Track menstrual cycles and patterns</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                  <span className="text-gray-700">Predict next period dates</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span className="text-gray-700">Monitor symptoms and moods</span>
                </div>
              </div>

              {/* Enhanced Visual Element with Calendar Illustration */}
              <div className="relative h-40 bg-gradient-to-r from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center mb-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-2xl"></div>
                {/* Calendar grid background */}
                <div className="absolute inset-0 opacity-20">
                  <div className="grid grid-cols-7 gap-1 p-4 h-full">
                    {Array.from({length: 21}).map((_, i) => (
                      <div key={i} className="bg-white/30 rounded-sm"></div>
                    ))}
                  </div>
                </div>
                <div className="relative flex items-center space-x-6 z-10">
                  <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <Calendar className="h-10 w-10 text-pink-500" />
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-pink-600">28</div>
                    <div className="text-sm text-pink-500 font-medium">Day Cycle</div>
                  </div>
                  {/* Decorative dots */}
                  <div className="flex flex-col space-y-2">
                    <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                    <div className="w-4 h-4 bg-pink-300 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl p-4 text-center group-hover:shadow-lg transition-shadow duration-300">
                <p className="font-semibold">Start Tracking Your Periods</p>
                <p className="text-pink-100 text-sm mt-1">Get personalized insights</p>
              </div>
            </div>
          </div>

          {/* Pregnancy Tracking Card */}
          <div
            className="group relative overflow-hidden bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2"
            onClick={navigateToTrackPregnancy}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5"></div>
            <div className="relative p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Baby className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Pregnancy Tracker</h2>
                    <p className="text-purple-600 font-medium">Journey to Motherhood</p>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all duration-300" />
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-700">Week-by-week pregnancy progress</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <span className="text-gray-700">Baby development milestones</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                  <span className="text-gray-700">Health tips & reminders</span>
                </div>
              </div>

              {/* Enhanced Visual Element with Pregnancy Journey */}
              <div className="relative h-40 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-2xl"></div>
                {/* Progress bar background */}
                <div className="absolute bottom-4 left-4 right-4 h-2 bg-white/40 rounded-full">
                  <div className="h-full w-1/3 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full"></div>
                </div>
                <div className="relative flex items-center space-x-6 z-10">
                  <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <Baby className="h-10 w-10 text-purple-500" />
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">40</div>
                    <div className="text-sm text-purple-500 font-medium">Weeks Journey</div>
                  </div>
                  {/* Milestone dots */}
                  <div className="flex space-x-1">
                    <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-indigo-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-purple-300 rounded-full opacity-50"></div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl p-4 text-center group-hover:shadow-lg transition-shadow duration-300">
                <p className="font-semibold">Track Your Pregnancy</p>
                <p className="text-purple-100 text-sm mt-1">Monitor baby&apos;s growth</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
    </>
  );
};

export default PregnancyOvulationPage;


PregnancyOvulationPage.getLayout = function PageLayout(page: React.ReactNode) {
  return <L1>{page}</L1>; 
}