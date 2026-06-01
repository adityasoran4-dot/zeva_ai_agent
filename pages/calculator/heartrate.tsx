import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { Heart, Play, Square, Info } from 'lucide-react';

function HeartRateMonitor(){
  const [heartRate, setHeartRate] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [currentBPM, setCurrentBPM] = useState<number>(0);

  // Simulate heart rate monitoring
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMonitoring && heartRate) {
      interval = setInterval(() => {
        const baseRate: number = parseInt(heartRate);
        const variation: number = Math.random() * 6 - 3; // ±3 BPM variation
        const newRate: number = Math.max(40, Math.min(200, Math.round(baseRate + variation)));
        setCurrentBPM(newRate);
      }, 1000);
    } else {
      setCurrentBPM(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring, heartRate]);

  const getHeartRateStatus = (bpm: number, userAge: string): string => {
    if (!userAge || bpm === 0) return 'Enter details to start';
    
    const maxHR: number = 220 - parseInt(userAge);
    const restingZone: number = maxHR * 0.5;
    const fatBurnZone: number = maxHR * 0.7;
    const cardioZone: number = maxHR * 0.85;
    
    if (bpm < 60) return 'Resting';
    if (bpm < restingZone) return 'Light Activity';
    if (bpm < fatBurnZone) return 'Fat Burn Zone';
    if (bpm < cardioZone) return 'Cardio Zone';
    return 'Peak Zone';
  };

  const status: string = getHeartRateStatus(currentBPM, age);

return (
  <>
    <Head>
      <title>Heart Rate Monitor | Track Cardiovascular Health – ZEVA</title>
      <meta
        name="description"
        content="Use ZEVA's Heart Rate Monitor to track your heart rate, assess cardiovascular health, and stay informed about your fitness and wellness."
      />
      <meta
        name="keywords"
        content="Heart Rate Monitor, heart rate tracker, pulse rate monitor, cardiovascular health tool, heart health calculator, resting heart rate check, fitness heart rate tool, health monitoring app, ZEVA heart monitor"
      />
      <meta property="og:title" content="Heart Rate Monitor | Track Cardiovascular Health – ZEVA" />
      <meta
        property="og:description"
        content="Use ZEVA's Heart Rate Monitor to track your heart rate, assess cardiovascular health, and stay informed about your fitness and wellness."
      />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Heart Rate Monitor | Track Cardiovascular Health – ZEVA" />
      <meta
        name="twitter:description"
        content="Use ZEVA's Heart Rate Monitor to track your heart rate, assess cardiovascular health, and stay informed about your fitness and wellness."
      />
      {/* Schema Markup - Heart Rate Monitor WebPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalWebPage",
            "name": "Heart Rate Monitor",
            "url": "https://zeva360.com/calculator/heartrate",
            "description": "Monitor your heart rate and cardiovascular health with ZEVA's Heart Rate Monitor. A free, easy-to-use tool to track pulse rate, understand heart health, and support daily wellness goals.",
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
            "about": {
              "@type": "MedicalCondition",
              "name": "Cardiovascular Health",
              "description": "Monitoring heart rate to assess cardiovascular fitness and overall heart health."
            },
            "mainEntity": {
              "@type": "SoftwareApplication",
              "name": "Heart Rate Monitor",
              "applicationCategory": "HealthApplication",
              "operatingSystem": "Web",
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
    <div className="min-h-screen bg-white">
    <div className="max-w-6xl mx-auto p-6">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Heart Rate Monitor</h1>
        <p className="text-gray-600">Track your heart rate effectively</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side - Input */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Input</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                placeholder="Enter your age"
                min="1"
                max="120"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Heart Rate (BPM)</label>
              <input
                type="number"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                placeholder="Enter BPM"
                min="30"
                max="220"
              />
            </div>
            
            <button
              onClick={() => setIsMonitoring(!isMonitoring)}
              disabled={!heartRate || !age}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-all flex items-center justify-center gap-3 ${
                isMonitoring
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-900 hover:bg-gray-800 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isMonitoring ? (
                <>
                  <Square className="w-5 h-5" />
                  Stop Monitoring
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Start Monitoring
                </>
              )}
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" />
              How to Calculate Your BPM
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <strong>Method 1 - Wrist Pulse:</strong>
                <p className="text-gray-600">Place 2 fingers on your wrist below your thumb. Count beats for 15 seconds, then multiply by 4.</p>
              </div>
              <div>
                <strong>Method 2 - Neck Pulse:</strong>
                <p className="text-gray-600">Place 2 fingers on your neck beside your windpipe. Count beats for 15 seconds, then multiply by 4.</p>
              </div>
              <div>
                <strong>Method 3 - Chest:</strong>
                <p className="text-gray-600">Place your hand over your heart. Count beats for 15 seconds, then multiply by 4.</p>
              </div>
              <div className="bg-white rounded-lg p-3 mt-4 border border-gray-200">
                <strong className="text-gray-900">Quick Tip:</strong>
                <p className="text-gray-600">For more accuracy, count for 30 seconds and multiply by 2, or count for a full 60 seconds.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Results */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Results</h2>
          
          <div className="text-center space-y-6">
            {/* Heart Display */}
            <div className="relative inline-block">
              <Heart 
                className={`w-24 h-24 mx-auto transition-all duration-300 ${
                  isMonitoring ? 'text-gray-900 animate-pulse' : 'text-gray-300'
                }`} 
                fill="currentColor"
              />
              {isMonitoring && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
            
            {/* BPM Display */}
            <div>
              <div className="text-6xl font-bold text-gray-900 mb-2">
                {currentBPM}
              </div>
              <div className="text-xl text-gray-600">BPM</div>
            </div>
            
            {/* Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-lg font-medium text-gray-900">{status}</div>
              {age && currentBPM > 0 && (
                <div className="text-sm text-gray-600 mt-1">
                  Max HR: {220 - parseInt(age)} BPM
                </div>
              )}
            </div>
            
            {/* Monitoring Status */}
            {isMonitoring ? (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Live Monitoring</span>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                {!heartRate || !age ? 'Fill in the details to start' : 'Press start to begin monitoring'}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Heart Rate Zones */}
      {age && (
        <div className="mt-6 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Heart Rate Zones</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-gray-900">Resting</div>
              <div className="text-gray-600">&lt; 60</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">Light</div>
              <div className="text-gray-600">60-{Math.round((220 - parseInt(age)) * 0.5)}</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">Fat Burn</div>
              <div className="text-gray-600">{Math.round((220 - parseInt(age)) * 0.5)}-{Math.round((220 - parseInt(age)) * 0.7)}</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">Cardio+</div>
              <div className="text-gray-600">{Math.round((220 - parseInt(age)) * 0.7)}+</div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  </>
);
};

export default HeartRateMonitor;

// HeartRateMonitor.getLayout = function PageLayout(page: React.ReactNode) {
//   return page; // No layout
// }