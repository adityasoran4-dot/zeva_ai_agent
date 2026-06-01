import { useState } from 'react';
import Head from 'next/head';
import { Calculator, TrendingUp, Target, Info } from 'lucide-react';

const BMRCalculator = () => {
  const [formData, setFormData] = useState({
    age: '',
    gender: 'male',
    weight: '',
    height: '',
    activity: '1.2'
  });

  const [results, setResults] = useState(null);

  const activities = [
    { value: '1.2', label: 'Sedentary', desc: 'Little or no exercise' },
    { value: '1.375', label: 'Light', desc: '1-3 days/week' },
    { value: '1.55', label: 'Moderate', desc: '3-5 days/week' },
    { value: '1.725', label: 'Active', desc: '6-7 days/week' },
    { value: '1.9', label: 'Very Active', desc: 'Intense daily' }
  ];

  const calculate = () => {
    const w = parseFloat(formData.weight);
    const h = parseFloat(formData.height);
    const a = parseInt(formData.age);

    if (!w || !h || !a) return;

    let bmr = formData.gender === 'male'
      ? (10 * w) + (6.25 * h) - (5 * a) + 5
      : (10 * w) + (6.25 * h) - (5 * a) - 161;

    const tdee = bmr * parseFloat(formData.activity);

    setResults({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      loss: Math.round(tdee - 500),
      gain: Math.round(tdee + 500)
    });
  };

  const update = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <Head>
        <title>BMR &amp; TDEE Calculator Online | Calculate Daily Calorie Needs – ZEVA</title>
        <meta
          name="description"
          content="Use ZEVA's free BMR-TDEE Calculator to calculate your Basal Metabolic Rate and Total Daily Energy Expenditure. Find your daily calorie needs for weight goals."
        />
        <meta
          name="keywords"
          content="BMR TDEE Calculator, BMR calculator online, TDEE calculator, daily calorie needs calculator, basal metabolic rate calculator, calorie expenditure calculator, fitness calorie calculator, weight management tool, metabolism calculator, health calculator, ZEVA BMR TDEE tool"
        />
        <meta property="og:title" content="BMR &amp; TDEE Calculator Online | Calculate Daily Calorie Needs – ZEVA" />
        <meta
          property="og:description"
          content="Use ZEVA's free BMR-TDEE Calculator to calculate your Basal Metabolic Rate and Total Daily Energy Expenditure. Find your daily calorie needs for weight goals."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="BMR &amp; TDEE Calculator Online | Calculate Daily Calorie Needs – ZEVA" />
        <meta
          name="twitter:description"
          content="Use ZEVA's free BMR-TDEE Calculator to calculate your Basal Metabolic Rate and Total Daily Energy Expenditure. Find your daily calorie needs for weight goals."
        />
        {/* Schema Markup - BMR-TDEE Calculator WebPage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["WebPage", "MedicalWebPage"],
              "name": "BMR–TDEE Calculator",
              "url": "https://zeva360.com/calculator/bmr-tdee",
              "description": "ZEVA BMR–TDEE Calculator helps you calculate your Basal Metabolic Rate and Total Daily Energy Expenditure to understand daily calorie needs and support weight management and fitness goals.",
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
                "name": "BMR–TDEE Calculator",
                "applicationCategory": "HealthApplication",
                "operatingSystem": "Web",
                "description": "A free online calculator that estimates Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE) to help users plan calorie intake, weight loss, or muscle gain goals.",
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4">
            <Calculator className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">BMR Calculator</h1>
          <p className="text-slate-600">Calculate your daily calorie needs</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Input Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
            <div className="space-y-6">
              
              {/* Age & Gender Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => update('age', e.target.value)}
                    placeholder="25"
                    className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['male', 'female'].map(g => (
                      <button
                        key={g}
                        onClick={() => update('gender', g)}
                        className={`py-3 rounded-xl font-medium text-sm transition-all ${
                          formData.gender === g
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {g === 'male' ? 'M' : 'F'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Weight & Height Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => update('weight', e.target.value)}
                    placeholder="70"
                    className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Height (cm)</label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => update('height', e.target.value)}
                    placeholder="175"
                    className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              {/* Activity Level */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Activity Level</label>
                <div className="space-y-2">
                  {activities.map(act => (
                    <label
                      key={act.value}
                      className={`flex items-center p-3 rounded-xl cursor-pointer transition-all ${
                        formData.activity === act.value
                          ? 'bg-indigo-50 border-2 border-indigo-600'
                          : 'bg-slate-50 border-2 border-transparent hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="activity"
                        value={act.value}
                        checked={formData.activity === act.value}
                        onChange={(e) => update('activity', e.target.value)}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium text-slate-900 text-sm">{act.label}</div>
                        <div className="text-xs text-slate-600">{act.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Calculate Button */}
              <button
                onClick={calculate}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Calculator className="w-5 h-5" />
                Calculate
              </button>
            </div>
          </div>

          {/* Results Card */}
          <div className="space-y-6">
            {results ? (
              <>
                {/* Main Results */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                  <div className="space-y-6">
                    
                    {/* BMR */}
                    <div className="text-center pb-6 border-b border-slate-100">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl mb-3">
                        <TrendingUp className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div className="text-sm font-medium text-slate-600 mb-1">Basal Metabolic Rate</div>
                      <div className="text-4xl font-bold text-slate-900">{results.bmr}</div>
                      <div className="text-sm text-slate-500 mt-1">calories/day</div>
                    </div>

                    {/* TDEE */}
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mb-3">
                        <Target className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="text-sm font-medium text-slate-600 mb-1">Total Daily Energy</div>
                      <div className="text-4xl font-bold text-slate-900">{results.tdee}</div>
                      <div className="text-sm text-slate-500 mt-1">calories/day</div>
                    </div>
                  </div>
                </div>

                {/* Goals */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                  <h3 className="font-semibold text-slate-900 mb-4">Your Goals</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                      <span className="text-sm font-medium text-slate-700">Weight Loss</span>
                      <span className="text-lg font-bold text-red-600">{results.loss}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm font-medium text-slate-700">Maintain</span>
                      <span className="text-lg font-bold text-slate-900">{results.tdee}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                      <span className="text-sm font-medium text-slate-700">Weight Gain</span>
                      <span className="text-lg font-bold text-emerald-600">{results.gain}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-2xl mb-4">
                    <Info className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Enter Your Details</h3>
                  <p className="text-sm text-slate-600 max-w-xs">Fill in your information and click calculate to see your results</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">Using Mifflin-St Jeor Equation (1990)</p>
        </div>
      </div>
    </div>
    </>
  );
};

export default BMRCalculator;