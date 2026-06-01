import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

const Loader = () => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing');

  useEffect(() => {
    const loadingSteps = [
      { progress: 20, text: 'Loading' },
      { progress: 40, text: 'Connecting' },
      { progress: 60, text: 'Authenticating' },
      { progress: 80, text: 'Preparing' },
      { progress: 100, text: 'Ready' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < loadingSteps.length) {
        setProgress(loadingSteps[currentStep].progress);
        setLoadingText(loadingSteps[currentStep].text);
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, 600);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed inset-0 bg-white z-[9999] flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center justify-center gap-8">
        {/* Minimal Spinner */}
        <div className="relative w-16 h-16">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-slate-200"></div>
          
          {/* Animated ring */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-teal-600 animate-spin"></div>
          
          {/* Inner glow - more visible */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-teal-600/40 to-blue-600/40"></div>
          
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-7 h-7 text-teal-600 fill-teal-600" strokeWidth={2} />
          </div>
        </div>
        
        {/* Brand */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            ZEVA
          </h1>
          <div className="h-px w-12 bg-gradient-to-r from-transparent via-teal-600 to-transparent mx-auto"></div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-64 space-y-3">
          <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-teal-600 to-blue-600 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
          
          {/* Status Text */}
          <div className="text-center">
            <span className="text-sm text-slate-400 font-medium">
              {loadingText}
            </span>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
        
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Loader;