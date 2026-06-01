import React, { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'

interface GameState {
  isRunning: boolean;
  seconds: number;
  maxSeconds: number;
  bestScore: number;
}

interface ResultMessage {
  title: string;
  message: string;
  emoji: string;
}

function BreathHold() {
  const [gameState, setGameState] = useState<GameState>({
    isRunning: false,
    seconds: 0,
    maxSeconds: 180,
    bestScore: 0
  });
  
  const [showResult, setShowResult] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<ResultMessage | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Timer effect
  useEffect(() => {
    if (gameState.isRunning) {
      startTimeRef.current = Date.now() - (gameState.seconds * 1000);
      
      const updateTimer = () => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          
          if (elapsed >= gameState.maxSeconds) {
            handleStop();
            return;
          }
          
          setGameState(prev => ({ ...prev, seconds: elapsed }));
          timerRef.current = setTimeout(updateTimer, 100);
        }
      };
      
      timerRef.current = setTimeout(updateTimer, 100);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [gameState.isRunning, gameState.maxSeconds]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getResultMessage = useCallback((seconds: number): ResultMessage => {
    const messages = [
      { max: 29, title: "That was quick, habibi!", message: "No stress — take a deep breath and give it another try!", emoji: "😊" },
      { max: 59, title: "Getting there!", message: "With a bit more practice, you'll be flying — slowly slowly, you're building it up!", emoji: "🚀" },
      { max: 99, title: "Mashallah! That's strong breathing", message: "Keep it steady like a pro!", emoji: "💪" },
      { max: 149, title: "Very nice!", message: "Your lungs are working like a champ — almost at elite level!", emoji: "🏆" },
      { max: 179, title: "Khalas! This is top-tier breathing", message: "Solid control, real Dubai style!", emoji: "⭐" },
      { max: Infinity, title: "Legendary! You reached the max", message: "Salute to your breath control, full respect!", emoji: "👑" }
    ];
    
    return messages.find(m => seconds <= m.max) || messages[messages.length - 1];
  }, []);

  const handleStart = useCallback((): void => {
    setGameState(prev => ({ ...prev, isRunning: true, seconds: 0 }));
    setShowResult(false);
    setCurrentResult(null);
  }, []);

  const handleStop = useCallback((): void => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    setGameState(prev => {
      const newBest = prev.seconds > prev.bestScore ? prev.seconds : prev.bestScore;
      return { ...prev, isRunning: false, bestScore: newBest };
    });
    
    const result = getResultMessage(gameState.seconds);
    setCurrentResult(result);
    setShowResult(true);
  }, [gameState.seconds, getResultMessage]);

  const handleReset = useCallback((): void => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setGameState(prev => ({ ...prev, isRunning: false, seconds: 0 }));
    setShowResult(false);
    setCurrentResult(null);
  }, []);

  const closeModal = useCallback((): void => {
    setShowResult(false);
    setCurrentResult(null);
    // Reset the game state after closing modal
    setGameState(prev => ({ ...prev, seconds: 0, isRunning: false }));
  }, []);

  const progressPercentage = (gameState.seconds / gameState.maxSeconds) * 100;
  
  const getStatusText = (): string => {
    if (gameState.isRunning) return "Hold your breath! Stay strong!";
    if (gameState.seconds > 0 && !showResult) return `You held for ${gameState.seconds} seconds!`;
    return "Ready to start your breath challenge?";
  };

return (
  <>
    <Head>
      <title>Breath Hold Calculator | Measure Lung Capacity – ZEVA</title>
      <meta
        name="description"
        content="Use ZEVA's Breath Hold Calculator to track breath-holding capacity, assess lung health, and improve breathing performance with instant results."
      />
      <meta
        name="keywords"
        content="Breath Hold Calculator, breath holding capacity, lung capacity test, breathing health calculator, respiratory health tool, breath hold time test, lung health assessment, breathing performance test, oxygen capacity check, fitness breathing tool, ZEVA health calculator"
      />
      <meta property="og:title" content="Breath Hold Calculator | Measure Lung Capacity – ZEVA" />
      <meta
        property="og:description"
        content="Use ZEVA's Breath Hold Calculator to track breath-holding capacity, assess lung health, and improve breathing performance with instant results."
      />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Breath Hold Calculator | Measure Lung Capacity – ZEVA" />
      <meta
        name="twitter:description"
        content="Use ZEVA's Breath Hold Calculator to track breath-holding capacity, assess lung health, and improve breathing performance with instant results."
      />
      {/* Schema Markup - Breath Hold Calculator WebPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalWebPage",
            "name": "Breath Hold Calculator",
            "url": "https://zeva360.com/calculator/breathhold",
            "description": "Track your breath-holding capacity and improve lung health using ZEVA's Breath Hold Calculator. A free, easy-to-use tool designed to help users understand respiratory fitness and breathing control.",
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
              "name": "Respiratory Health",
              "description": "Measurement of breath-holding capacity to assess lung strength and breathing efficiency."
            },
            "mainEntity": {
              "@type": "SoftwareApplication",
              "name": "Breath Hold Calculator",
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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
    <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-6xl shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
          🫁 Lung Checker
        </h1>
        <div className="bg-gray-100 px-6 py-3 rounded-full border border-gray-200">
          <span className="text-lg font-semibold text-gray-900">
            Best: {formatTime(gameState.bestScore)}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Game Section */}
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Lung Animation */}
          <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
            {gameState.isRunning ? (
              <>
                {/* Breathing animation rings */}
                <div className="absolute inset-0 border-2 border-gray-300 rounded-full animate-ping opacity-75"></div>
                <div className="absolute inset-0 border-2 border-gray-400 rounded-full animate-ping opacity-50" style={{ animationDelay: '0.3s' }}></div>
                <div className="absolute inset-0 border border-gray-200 rounded-full animate-ping opacity-25" style={{ animationDelay: '0.6s' }}></div>
                
                {/* Animated emoji */}
                <div className="text-6xl md:text-7xl relative z-10 animate-[breathe_2s_ease-in-out_infinite]">
                  🫁
                </div>
              </>
            ) : (
              <div className="text-6xl md:text-7xl">
                🫁
              </div>
            )}
          </div>
          
          {/* Timer */}
          <div className="text-5xl md:text-7xl font-mono font-bold text-gray-900">
            {formatTime(gameState.seconds)}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full max-w-md h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
            <div 
              className="h-full bg-gray-900 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          {/* Status */}
          <div className="text-lg md:text-xl text-gray-600 font-medium">
            {getStatusText()}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <button 
              className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 uppercase tracking-wider"
              onClick={handleStart}
              disabled={gameState.isRunning}
            >
              Start
            </button>
            <button 
              className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 uppercase tracking-wider"
              onClick={handleStop}
              disabled={!gameState.isRunning}
            >
              Stop
            </button>
            <button 
              className="bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-8 rounded-full transition-all duration-300 uppercase tracking-wider border-2 border-gray-900"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">How to Play:</h3>
          <div className="space-y-4 text-gray-700">
            <p className="flex items-center gap-3 text-lg">
              <span className="text-gray-900 font-bold text-xl">1.</span>
              Click Start and take a deep breath
            </p>
            <p className="flex items-center gap-3 text-lg">
              <span className="text-gray-900 font-bold text-xl">2.</span>
              Hold your breath as long as possible
            </p>
            <p className="flex items-center gap-3 text-lg">
              <span className="text-gray-900 font-bold text-xl">3.</span>
              Click Stop when you need to breathe
            </p>
            <p className="flex items-center gap-3 text-lg">
              <span className="text-gray-900 font-bold text-xl">4.</span>
              Maximum time: 180 seconds
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Result Modal */}
    {showResult && currentResult && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-md shadow-2xl relative">
          <button 
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors duration-200 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            onClick={closeModal}
          >
            <span className="text-2xl leading-none">&times;</span>
          </button>
          
          <div className="text-center pt-4">
            <div className="text-6xl mb-4">
              {currentResult.emoji}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {currentResult.title}
            </h2>
            
            <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 mb-4">
              <div className="text-xl font-bold text-gray-900">
                You held for {formatTime(gameState.seconds)}!
              </div>
            </div>
            
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              {currentResult.message}
            </p>
            
            {gameState.seconds > gameState.bestScore && (
              <div className="text-gray-900 font-bold text-lg">
                🎉 New Personal Best! 🎉
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    <style jsx>{`
      @keyframes breathe {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.15);
        }
      }
    `}</style>
    </div>
  </>
  );
}

export default BreathHold;

// BreathHold.getLayout = function PageLayout(page: React.ReactNode) {
//   return page; // No layout
// };