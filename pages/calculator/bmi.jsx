import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Activity } from 'lucide-react';

function BMICalculator() {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [system, setSystem] = useState('metric');
  const [bmi, setBmi] = useState(null);

  const calculateBMI = () => {
    if (!weight || !height) return;

    const w = parseFloat(weight);
    const h = parseFloat(height);

    let bmiValue;
    if (system === 'metric') {
      bmiValue = w / ((h / 100) ** 2);
    } else {
      bmiValue = (w / (h ** 2)) * 703;
    }

    setBmi(bmiValue.toFixed(1));
  };

  useEffect(() => {
    if (weight && height) {
      const timer = setTimeout(calculateBMI, 300);
      return () => clearTimeout(timer);
    } else {
      setBmi(null);
    }
  }, [weight, height, system]);

  const getCategory = (value) => {
    if (!value) return null;
    if (value < 18.5) return { text: 'Underweight', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (value < 25) return { text: 'Normal', color: 'text-green-600', bg: 'bg-green-50' };
    if (value < 30) return { text: 'Overweight', color: 'text-amber-600', bg: 'bg-amber-50' };
    return { text: 'Obese', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const category = getCategory(bmi);

  return (
    <>
      <Head>
        <title>BMI Calculator Online | Check Body Mass Index &amp; Weight Category – ZEVA</title>
        <meta
          name="description"
          content="Use ZEVA's free BMI Calculator to calculate your Body Mass Index instantly. Understand your weight category and health status, and maintain a balanced lifestyle."
        />
        <meta
          name="keywords"
          content="BMI Calculator, body mass index calculator, BMI check online, calculate BMI, weight category calculator, healthy weight check, BMI chart, fitness calculator, health calculator, free BMI calculator, ZEVA BMI tool, body weight assessment"
        />
        <meta property="og:title" content="BMI Calculator Online | Check Body Mass Index &amp; Weight Category – ZEVA" />
        <meta
          property="og:description"
          content="Use ZEVA's free BMI Calculator to calculate your Body Mass Index instantly. Understand your weight category and health status, and maintain a balanced lifestyle."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="BMI Calculator Online | Check Body Mass Index &amp; Weight Category – ZEVA" />
        <meta
          name="twitter:description"
          content="Use ZEVA's free BMI Calculator to calculate your Body Mass Index instantly. Understand your weight category and health status, and maintain a balanced lifestyle."
        />
        {/* Schema Markup - BMI Calculator WebPage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["WebPage", "MedicalWebPage"],
              "name": "BMI Calculator",
              "url": "https://zeva360.com/calculator/bmi",
              "description": "ZEVA BMI Calculator helps you calculate your Body Mass Index instantly and understand your weight category with clear health insights using a free and easy-to-use tool.",
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
                "name": "BMI Calculator",
                "applicationCategory": "HealthApplication",
                "operatingSystem": "Web",
                "description": "A free online BMI calculator that allows users to determine their body mass index and understand weight classifications such as underweight, normal, overweight, and obese.",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD"
                },
                "medicalSpecialty": "Nutrition"
              }
            })
          }}
        />
      </Head>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-900 rounded-lg mb-3">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">BMI Calculator</h1>
          <p className="text-sm text-gray-500 mt-1">Body Mass Index</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
          <div className="grid lg:grid-cols-2 gap-8">

            {/* Left Side - Form */}
            <div>
              {/* Unit Toggle */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setSystem('metric')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    system === 'metric'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Metric
                </button>
                <button
                  onClick={() => setSystem('imperial')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    system === 'imperial'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Imperial
                </button>
              </div>

              {/* Inputs */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Weight {system === 'metric' ? '(kg)' : '(lb)'}
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="70"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Height {system === 'metric' ? '(cm)' : '(in)'}
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder={system === 'metric' ? '170' : '67'}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Reference on Mobile */}
              <div className="lg:hidden pt-4 border-t border-gray-100">
                <div className="text-xs font-medium text-gray-700 mb-2">Reference</div>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex justify-between"><span>Underweight</span><span className="font-medium">&lt; 18.5</span></div>
                  <div className="flex justify-between"><span>Normal</span><span className="font-medium">18.5 - 24.9</span></div>
                  <div className="flex justify-between"><span>Overweight</span><span className="font-medium">25 - 29.9</span></div>
                  <div className="flex justify-between"><span>Obese</span><span className="font-medium">≥ 30</span></div>
                </div>
              </div>
            </div>

            {/* Right Side - Result */}
            <div className="lg:border-l lg:border-gray-100 lg:pl-8">
              {bmi ? (
                <div className="space-y-4">
                  <div className="text-center py-6 bg-gray-50 rounded-xl">
                    <div className="text-4xl font-bold text-gray-900 mb-1">{bmi}</div>
                    <div className="text-xs text-gray-500">Your BMI</div>
                  </div>

                  {category && (
                    <div className={`${category.bg} rounded-lg px-4 py-3 text-center`}>
                      <span className={`text-sm font-medium ${category.color}`}>
                        {category.text}
                      </span>
                    </div>
                  )}

                  {/* Reference on Desktop */}
                  <div className="hidden lg:block pt-4 border-t border-gray-100">
                    <div className="text-xs font-medium text-gray-700 mb-2">Reference</div>
                    <div className="space-y-1.5 text-xs text-gray-600">
                      <div className="flex justify-between"><span>Underweight</span><span className="font-medium">&lt; 18.5</span></div>
                      <div className="flex justify-between"><span>Normal</span><span className="font-medium">18.5 - 24.9</span></div>
                      <div className="flex justify-between"><span>Overweight</span><span className="font-medium">25 - 29.9</span></div>
                      <div className="flex justify-between"><span>Obese</span><span className="font-medium">≥ 30</span></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-sm">Enter your measurements</div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center mt-4">
          BMI is a general indicator. Consult a healthcare professional for personalized advice.
        </p>
      </div>
    </div>
    </>
  );
}

export default BMICalculator;
