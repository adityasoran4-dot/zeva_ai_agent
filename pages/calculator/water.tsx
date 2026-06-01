import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { Droplets } from 'lucide-react';

interface WaterCalculatorState {
  weight: string;
  weightUnit: 'kg' | 'lbs';
  activityLevel: 'low' | 'moderate' | 'high';
  exerciseMinutes: string;
  exerciseDays: string;
}

function WaterIntakeCalculator() {
  const [state, setState] = useState<WaterCalculatorState>({
    weight: '',
    weightUnit: 'kg',
    activityLevel: 'moderate',
    exerciseMinutes: '0',
    exerciseDays: '0'
  });

  const [results, setResults] = useState({
    basicWater: 0,
    totalWater: 0,
    cups: 0,
    bottles: 0,
    weeklyExerciseWater: 0,
    dailyAverageExerciseWater: 0
  });

  const updateState = (updates: Partial<WaterCalculatorState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    if (state.weight) {
      const weightInKg = state.weightUnit === 'lbs'
        ? parseFloat(state.weight) * 0.453592
        : parseFloat(state.weight);

      const exerciseMin = parseFloat(state.exerciseMinutes) || 0;
      const exerciseDays = parseFloat(state.exerciseDays) || 0;

      // Basic water calculation
      const basicWater = weightInKg * 0.033;

      // Activity level multipliers
      const activityMultipliers = {
        low: 1.0,
        moderate: 1.1,
        high: 1.2
      };

      // Exercise water calculation
      // Total weekly exercise water
      const weeklyExerciseWater = (exerciseMin / 30) * 0.35 * exerciseDays;
      // Daily average exercise water (spread across 7 days)
      const dailyAverageExerciseWater = weeklyExerciseWater / 7;

      // Total daily water calculation
      const totalWater = (basicWater * activityMultipliers[state.activityLevel]) + dailyAverageExerciseWater;

      setResults({
        basicWater: Math.round(basicWater * 100) / 100,
        totalWater: Math.round(totalWater * 100) / 100,
        cups: Math.round((totalWater * 4.227) * 10) / 10, // 1 liter = ~4.227 cups
        bottles: Math.round((totalWater / 0.5) * 10) / 10, // assuming 500ml bottles
        weeklyExerciseWater: Math.round(weeklyExerciseWater * 100) / 100,
        dailyAverageExerciseWater: Math.round(dailyAverageExerciseWater * 100) / 100
      });
    } else {
      setResults({
        basicWater: 0,
        totalWater: 0,
        cups: 0,
        bottles: 0,
        weeklyExerciseWater: 0,
        dailyAverageExerciseWater: 0
      });
    }
  }, [state]);

  return (
    <>
      <Head>
        <title>Water Intake Tracker | Daily Hydration Calculator – ZEVA</title>
        <meta
          name="description"
          content="Use ZEVA's Water Intake Tracker to monitor daily water consumption, stay hydrated, and support overall health and wellness."
        />
        <meta
          name="keywords"
          content="Water Intake Tracker, daily water calculator, hydration tracker, water consumption calculator, hydration level check, healthy hydration tool, fitness hydration tracker, water reminder tool, ZEVA water tracker"
        />
        <meta property="og:title" content="Water Intake Tracker | Daily Hydration Calculator – ZEVA" />
        <meta
          property="og:description"
          content="Use ZEVA's Water Intake Tracker to monitor daily water consumption, stay hydrated, and support overall health and wellness."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Water Intake Tracker | Daily Hydration Calculator – ZEVA" />
        <meta
          name="twitter:description"
          content="Use ZEVA's Water Intake Tracker to monitor daily water consumption, stay hydrated, and support overall health and wellness."
        />
        {/* Schema Markup - Water Intake Tracker WebPage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "Water Intake Tracker",
              "url": "https://zeva360.com/calculator/water",
              "description": "Track your daily water consumption for optimal hydration with ZEVA's Water Intake Tracker. A free health tool to maintain hydration balance, support body functions, and improve overall wellness.",
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
                "name": "Hydration & Body Health",
                "description": "Monitoring daily water intake to support hydration, metabolism, and overall physical health."
              },
              "mainEntity": {
                "@type": "SoftwareApplication",
                "name": "Water Intake Tracker",
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Water Intake Calculator</h1>
          <p className="text-gray-600">Calculate your daily water intake based on weight, activity, and exercise</p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Side - Inputs */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Input Details</h2>

            <div className="space-y-6">
              {/* Weight Input */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Body Weight
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={state.weight}
                    onChange={(e) => updateState({ weight: e.target.value })}
                    placeholder="Enter weight"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                  />
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => updateState({ weightUnit: 'kg' })}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${state.weightUnit === 'kg'
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                      kg
                    </button>
                    <button
                      onClick={() => updateState({ weightUnit: 'lbs' })}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${state.weightUnit === 'lbs'
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                      lbs
                    </button>
                  </div>
                </div>
              </div>

              {/* Activity Level */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Activity Level
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'low', label: 'Low', desc: 'Sedentary lifestyle' },
                    { key: 'moderate', label: 'Moderate', desc: 'Light exercise' },
                    { key: 'high', label: 'High', desc: 'Active lifestyle' }
                  ].map((level) => (
                    <button
                      key={level.key}
                      onClick={() => updateState({ activityLevel: level.key as 'low' | 'moderate' | 'high' })}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${state.activityLevel === level.key
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="font-medium text-gray-900">{level.label}</div>
                      <div className="text-sm text-gray-600 mt-1">{level.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Exercise Input */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Additional Exercise
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-600 mb-2 block">Days per week</label>
                    <select
                      value={state.exerciseDays}
                      onChange={(e) => updateState({ exerciseDays: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 bg-white"
                    >
                      <option value="0">0 days</option>
                      <option value="1">1 day</option>
                      <option value="2">2 days</option>
                      <option value="3">3 days</option>
                      <option value="4">4 days</option>
                      <option value="5">5 days</option>
                      <option value="6">6 days</option>
                      <option value="7">7 days</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-2 block">Minutes per session</label>
                    <input
                      type="number"
                      value={state.exerciseMinutes}
                      onChange={(e) => updateState({ exerciseMinutes: e.target.value })}
                      placeholder="0"
                      min="0"
                      max="480"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Results */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Water Intake</h2>

            {state.weight ? (
              <div className="space-y-6">
                {/* Main Result */}
                <div className="bg-gray-900 rounded-lg p-6 text-white text-center">
                  <div className="text-5xl font-bold mb-2">
                    {results.totalWater}L
                  </div>
                  <div className="text-lg opacity-90">
                    Recommended Daily Intake
                  </div>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {results.basicWater}L
                    </div>
                    <div className="text-sm text-gray-600">Base Amount</div>
                    <div className="text-xs text-gray-500 mt-1">Weight × 0.033</div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {Math.round(((results.basicWater * (state.activityLevel === 'low' ? 1.0 : state.activityLevel === 'moderate' ? 1.1 : 1.2)) - results.basicWater) * 100) / 100}L
                    </div>
                    <div className="text-sm text-gray-600">Activity Level</div>
                    <div className="text-xs text-gray-500 mt-1 capitalize">{state.activityLevel}</div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {results.dailyAverageExerciseWater}L
                    </div>
                    <div className="text-sm text-gray-600">Exercise Bonus</div>
                    <div className="text-xs text-gray-500 mt-1">{state.exerciseDays}d × {state.exerciseMinutes}min</div>
                  </div>
                </div>

                {/* Exercise Details */}
                {results.weeklyExerciseWater > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">Exercise Water Breakdown</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total weekly exercise water:</span>
                        <span className="font-semibold text-gray-900">{results.weeklyExerciseWater}L</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Daily average from exercise:</span>
                        <span className="font-semibold text-gray-900">{results.dailyAverageExerciseWater}L</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Alternative Measurements */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Other Measurements</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-gray-700">Cups (8 oz)</span>
                      <span className="font-semibold text-gray-900">{results.cups}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-gray-700">Bottles (500ml)</span>
                      <span className="font-semibold text-gray-900">{results.bottles}</span>
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">💡 Hydration Tips</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Start your day with a glass of water</li>
                    <li>• Drink before, during, and after exercise</li>
                    <li>• Increase intake in hot weather</li>
                    <li>• Listen to your body&apos;s thirst signals</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Droplets className="w-8 h-8 text-gray-400" />
                </div>
                <div className="text-gray-500">
                  Enter your weight to see recommendations
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default WaterIntakeCalculator;



// WaterIntakeCalculator.getLayout = function PageLayout(page: React.ReactNode) {
//   return page; // No layout
// }