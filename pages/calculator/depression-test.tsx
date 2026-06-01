import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { ChevronRight, AlertTriangle, Heart, Stethoscope } from 'lucide-react';
import L1 from '../../components/Layout'

interface UserInfo {
  name: string;
  age: string;
}

interface Question {
  id: number;
  text: string;
}

const allQuestions: Question[] = [
  { id: 1, text: "I feel sad or down most of the time" },
  { id: 2, text: "I have lost interest in activities I used to enjoy" },
  { id: 3, text: "I feel tired or have little energy most days" },
  { id: 4, text: "I have trouble sleeping or sleep too much" },
  { id: 5, text: "I have difficulty concentrating on tasks" },
  { id: 6, text: "I feel worthless or guilty about things" },
  { id: 7, text: "I have changes in my appetite or weight" },
  { id: 8, text: "I move or speak more slowly than usual" },
  { id: 9, text: "I feel restless or agitated frequently" },
  { id: 10, text: "I have thoughts of death or self-harm" },
  { id: 11, text: "I find it hard to make decisions, even simple ones" },
  { id: 12, text: "I feel hopeless about the future" },
  { id: 13, text: "I cry more often than usual" },
  { id: 14, text: "I avoid social situations or being around people" },
  { id: 15, text: "I feel like a burden to others" },
  { id: 16, text: "I have trouble getting out of bed in the morning" },
  { id: 17, text: "I feel empty or numb inside" },
  { id: 18, text: "I get irritated or angry easily" },
  { id: 19, text: "I have lost my sense of humor" },
  { id: 20, text: "I feel overwhelmed by daily responsibilities" },
  { id: 21, text: "I have trouble enjoying things that should be fun" },
  { id: 22, text: "I feel disconnected from my friends and family" },
  { id: 23, text: "I worry excessively about things" },
  { id: 24, text: "I feel physically unwell without a clear cause" },
  { id: 25, text: "I have difficulty remembering things" },
  { id: 26, text: "I feel like nothing I do matters" },
  { id: 27, text: "I have lost confidence in myself" },
  { id: 28, text: "I feel like I&apos;m letting everyone down" },
  { id: 29, text: "I have trouble finishing tasks I start" },
  { id: 30, text: "I feel like life has no meaning or purpose" }
];

function DepressionTest() {
  const [currentStep, setCurrentStep] = useState<'info' | 'test' | 'result'>('info');
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', age: '' });
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);

  // Shuffle questions when component mounts
  useEffect(() => {
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, 25);
    setShuffledQuestions(shuffled);
  }, []);

  const handleUserInfoSubmit = () => {
    if (userInfo.name.trim() && userInfo.age.trim()) {
      setCurrentStep('test');
    }
  };

  const handleAnswer = (score: number) => {
    const newAnswers = [...answers, score];
    setAnswers(newAnswers);

    if (currentQuestion < shuffledQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setCurrentStep('result');
    }
  };

  const getTotalScore = () => {
    return answers.reduce((sum, score) => sum + score, 0);
  };

  const getResultMessage = () => {
    const totalScore = getTotalScore();
    const maxScore = shuffledQuestions.length * 4; // 4 is max score per question
    const percentage = (totalScore / maxScore) * 100;

    if (percentage >= 60) {
      return {
        type: 'severe',
        level: 'Severe Depression',
        title: 'Significant Concern',
        message: 'Your responses suggest you may be experiencing significant symptoms of depression. We strongly recommend consulting with a qualified mental health professional or your primary care doctor as soon as possible.',
        color: 'text-red-800 bg-red-50',
        needsHelp: true
      };
    } else if (percentage >= 40) {
      return {
        type: 'moderate',
        level: 'Moderate Depression',
        title: 'Moderate Concern',
        message: 'Your responses suggest you may be experiencing some symptoms of depression. Consider speaking with a healthcare professional about how you&apos;re feeling.',
        color: 'text-orange-800 bg-orange-50',
        needsHelp: true
      };
    } else if (percentage >= 20) {
      return {
        type: 'mild',
        level: 'Mild Depression',
        title: 'Mild Concern',
        message: 'Your responses suggest mild symptoms. While this may be normal stress, consider monitoring your mood and reaching out for support if symptoms persist.',
        color: 'text-yellow-800 bg-yellow-50',
        needsHelp: false
      };
    } else {
      return {
        type: 'minimal',
        level: 'Minimal Depression',
        title: 'Minimal Concern',
        message: 'Your responses suggest minimal symptoms of depression. Continue taking care of your mental health through self-care and healthy habits.',
        color: 'text-green-800 bg-green-50',
        needsHelp: false
      };
    }
  };

  const getScoreChart = () => {
    const maxScore = shuffledQuestions.length * 4;
    return [
      {
        range: `0 - ${Math.floor(maxScore * 0.2)}`,
        percentage: '0% - 20%',
        level: 'Minimal Depression',
        description: 'Little to no symptoms present',
        color: 'bg-green-50 text-green-800'
      },
      {
        range: `${Math.floor(maxScore * 0.2) + 1} - ${Math.floor(maxScore * 0.4)}`,
        percentage: '21% - 40%',
        level: 'Mild Depression',
        description: 'Some symptoms that may affect daily life',
        color: 'bg-yellow-50 text-yellow-800'
      },
      {
        range: `${Math.floor(maxScore * 0.4) + 1} - ${Math.floor(maxScore * 0.6)}`,
        percentage: '41% - 60%',
        level: 'Moderate Depression',
        description: 'Notable symptoms requiring attention',
        color: 'bg-orange-50 text-orange-800'
      },
      {
        range: `${Math.floor(maxScore * 0.6) + 1} - ${maxScore}`,
        percentage: '61% - 100%',
        level: 'Severe Depression',
        description: 'Significant symptoms requiring immediate care',
        color: 'bg-red-50 text-red-800'
      }
    ];
  };

  const redirectToDoctorSearch = () => {
    window.location.href = '/doctor/search';
  };

  const restartTest = () => {
    setCurrentStep('info');
    setUserInfo({ name: '', age: '' });
    setCurrentQuestion(0);
    setAnswers([]);
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, 25);
    setShuffledQuestions(shuffled);
  };

  if (currentStep === 'info') {
    return (
      <>
        <Head>
          <title>Depression Test Calculator – Check Signs of Depression Online</title>
          <meta
            name="description"
            content="Use ZEVA's Depression Test Calculator to gently assess possible signs of depression. Take a confidential, free mental health self-check and gain insights into your emotional well-being anytime."
          />
          <meta
            name="keywords"
            content="Depression Test Calculator, depression test online, signs of depression, mental health test, depression self check, emotional health assessment, mental wellness tool, mood assessment test, stress and depression test, online mental health calculator, ZEVA depression test, mental health awareness, free depression test, psychological wellbeing test, self assessment for depression"
          />
          <meta property="og:title" content="Depression Test Calculator – Check Signs of Depression Online" />
          <meta
            property="og:description"
            content="Use ZEVA's Depression Test Calculator to gently assess possible signs of depression. Take a confidential, free mental health self-check and gain insights into your emotional well-being anytime."
          />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Depression Test Calculator – Check Signs of Depression Online" />
          <meta
            name="twitter:description"
            content="Use ZEVA's Depression Test Calculator to gently assess possible signs of depression. Take a confidential, free mental health self-check and gain insights into your emotional well-being anytime."
          />
          {/* Schema Markup - Depression Test Calculator WebPage */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": ["WebPage", "MedicalWebPage"],
                "name": "Depression Test Calculator",
                "url": "https://zeva360.com/calculator/depression-test",
                "description": "ZEVA Depression Test Calculator is a gentle, confidential mental health screening tool designed to help users understand possible signs of depression and take the first step toward emotional well-being.",
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
                  "name": "Depression Test Calculator",
                  "applicationCategory": "HealthApplication",
                  "operatingSystem": "Web",
                  "description": "A free online mental health screening tool that helps users recognize potential depression symptoms through a short, private self-assessment.",
                  "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
                  },
                  "medicalSpecialty": "Psychiatry"
                }
              })
            }}
          />
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Mental Health Screening</h1>
            <p className="text-gray-600 text-sm">Please provide your basic information to begin</p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={userInfo.name}
                onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                className="text-gray-900 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              <input
                type="number"
                value={userInfo.age}
                onChange={(e) => setUserInfo({ ...userInfo, age: e.target.value })}
                className="text-gray-900 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Your age"
                min="13"
                max="120"
              />
            </div>

            <button
              onClick={handleUserInfoSubmit}
              className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 transition-colors mt-6"
            >
              Continue
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-6">
            Provided by ZEVA
          </p>
        </div>
      </div>
      </>
    );
  }

  if (currentStep === 'test') {
    return (
      <>
        <Head>
          <title>Depression Test Calculator – Check Signs of Depression Online</title>
          <meta
            name="description"
            content="Use ZEVA's Depression Test Calculator to gently assess possible signs of depression. Take a confidential, free mental health self-check and gain insights into your emotional well-being anytime."
          />
          <meta
            name="keywords"
            content="Depression Test Calculator, depression test online, signs of depression, mental health test, depression self check, emotional health assessment, mental wellness tool, mood assessment test, stress and depression test, online mental health calculator, ZEVA depression test, mental health awareness, free depression test, psychological wellbeing test, self assessment for depression"
          />
          <meta property="og:title" content="Depression Test Calculator – Check Signs of Depression Online" />
          <meta
            property="og:description"
            content="Use ZEVA's Depression Test Calculator to gently assess possible signs of depression. Take a confidential, free mental health self-check and gain insights into your emotional well-being anytime."
          />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Depression Test Calculator – Check Signs of Depression Online" />
          <meta
            name="twitter:description"
            content="Use ZEVA's Depression Test Calculator to gently assess possible signs of depression. Take a confidential, free mental health self-check and gain insights into your emotional well-being anytime."
          />
          {/* Schema Markup - Depression Test Calculator WebPage */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": ["WebPage", "MedicalWebPage"],
                "name": "Depression Test Calculator",
                "url": "https://zeva360.com/calculator/depression-test",
                "description": "ZEVA Depression Test Calculator is a gentle, confidential mental health screening tool designed to help users understand possible signs of depression and take the first step toward emotional well-being.",
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
                  "name": "Depression Test Calculator",
                  "applicationCategory": "HealthApplication",
                  "operatingSystem": "Web",
                  "description": "A free online mental health screening tool that helps users recognize potential depression symptoms through a short, private self-assessment.",
                  "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
                  },
                  "medicalSpecialty": "Psychiatry"
                }
              })
            }}
          />
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-black">Hello, {userInfo.name}</h2>
              <span className="text-sm text-black">Age: {userInfo.age}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#2D9AA5] h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / shuffledQuestions.length) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-black mt-2">
              Question {currentQuestion + 1} of {shuffledQuestions.length}
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-medium text-black mb-6">
              {shuffledQuestions[currentQuestion]?.text}
            </h3>

            <div className="space-y-3">
              {[
                { label: 'Never', score: 0, color: 'bg-green-100 hover:bg-green-200 text-green-800' },
                { label: 'Rarely', score: 1, color: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800' },
                { label: 'Sometimes', score: 2, color: 'bg-orange-100 hover:bg-orange-200 text-orange-800' },
                { label: 'Often', score: 3, color: 'bg-red-100 hover:bg-red-200 text-red-800' },
                { label: 'Always', score: 4, color: 'bg-red-200 hover:bg-red-300 text-red-900' }
              ].map((option) => (
                <button
                  key={option.score}
                  onClick={() => handleAnswer(option.score)}
                  className={`w-full p-4 rounded-lg border transition-all text-left font-medium ${option.color}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-black">
              Please answer honestly based on how you&apos;ve been feeling over the past two weeks
            </p>
          </div>
        </div>
      </div>
      </>
    );
  }

  if (currentStep === 'result') {
    const result = getResultMessage();
    const totalScore = getTotalScore();
    const maxScore = shuffledQuestions.length * 4;
    const percentage = Math.round((totalScore / maxScore) * 100);
    const scoreChart = getScoreChart();

    return (
      <>
        <Head>
          <title>Depression Test Calculator – Check Signs of Depression Online</title>
          <meta
            name="description"
            content="Use ZEVA's Depression Test Calculator to gently assess possible signs of depression. Take a confidential, free mental health self-check and gain insights into your emotional well-being anytime."
          />
          <meta
            name="keywords"
            content="Depression Test Calculator, depression test online, signs of depression, mental health test, depression self check, emotional health assessment, mental wellness tool, mood assessment test, stress and depression test, online mental health calculator, ZEVA depression test, mental health awareness, free depression test, psychological wellbeing test, self assessment for depression"
          />
          <meta property="og:title" content="Depression Test Calculator – Check Signs of Depression Online" />
          <meta
            property="og:description"
            content="Use ZEVA's Depression Test Calculator to gently assess possible signs of depression. Take a confidential, free mental health self-check and gain insights into your emotional well-being anytime."
          />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Depression Test Calculator – Check Signs of Depression Online" />
          <meta
            name="twitter:description"
            content="Use ZEVA's Depression Test Calculator to gently assess possible signs of depression. Take a confidential, free mental health self-check and gain insights into your emotional well-being anytime."
          />
          {/* Schema Markup - Depression Test Calculator WebPage */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": ["WebPage", "MedicalWebPage"],
                "name": "Depression Test Calculator",
                "url": "https://zeva360.com/calculator/depression-test",
                "description": "ZEVA Depression Test Calculator is a gentle, confidential mental health screening tool designed to help users understand possible signs of depression and take the first step toward emotional well-being.",
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
                  "name": "Depression Test Calculator",
                  "applicationCategory": "HealthApplication",
                  "operatingSystem": "Web",
                  "description": "A free online mental health screening tool that helps users recognize potential depression symptoms through a short, private self-assessment.",
                  "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
                  },
                  "medicalSpecialty": "Psychiatry"
                }
              })
            }}
          />
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-5xl">
          <div className="text-center mb-6">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${result.type === 'severe' ? 'bg-red-50' :
                result.type === 'moderate' ? 'bg-orange-50' :
                  result.type === 'mild' ? 'bg-yellow-50' :
                    'bg-green-50'
              }`}>
              {result.needsHelp ?
                <AlertTriangle className={`w-6 h-6 ${result.type === 'severe' ? 'text-red-500' : 'text-orange-500'
                  }`} /> :
                <Heart className="w-6 h-6 text-green-500" />
              }
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">{result.title}</h2>
            <p className="text-sm text-gray-600">Assessment completed for {userInfo.name}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Results */}
            <div className="space-y-6">
              {/* User Results Table */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Results</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm font-medium text-gray-700">Name:</span>
                      <span className="text-sm text-gray-900">{userInfo.name}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm font-medium text-gray-700">Age:</span>
                      <span className="text-sm text-gray-900">{userInfo.age}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm font-medium text-gray-700">Total Score:</span>
                      <span className="text-sm text-gray-900 font-semibold">{totalScore} / {maxScore}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm font-medium text-gray-700">Percentage:</span>
                      <span className="text-sm text-gray-900 font-semibold">{percentage}%</span>
                    </div>
                  </div>
                  <div className={`mt-4 p-3 rounded border ${result.color}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Depression Level:</span>
                      <span className="text-sm font-semibold">{result.level}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Result Message */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Assessment Summary:</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{result.message}</p>
              </div>

              {/* Consult Doctor Button */}
              <div className="flex justify-center">
                <button
                  onClick={redirectToDoctorSearch}
                  className="bg-blue-600 text-white py-2.5 px-6 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm hover:shadow flex items-center"
                >
                  <Stethoscope className="w-4 h-4 mr-2" />
                  Consult Our Doctors
                  <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={restartTest}
                  className="bg-gray-100 text-gray-700 py-2.5 px-6 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors border border-gray-300"
                >
                  Take Test Again
                </button>
              </div>
            </div>

            {/* Right Side - Statistics */}
            <div className="space-y-6">
              {/* Complete Score Chart */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Depression Score Chart</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 p-3 text-left text-xs font-semibold text-gray-700">Score Range</th>
                        <th className="border border-gray-200 p-3 text-left text-xs font-semibold text-gray-700">Percentage</th>
                        <th className="border border-gray-200 p-3 text-left text-xs font-semibold text-gray-700">Level</th>
                        <th className="border border-gray-200 p-3 text-left text-xs font-semibold text-gray-700">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scoreChart.map((row, index) => {
                        const isUserScore = totalScore >= parseInt(row.range.split(' - ')[0]) &&
                          totalScore <= parseInt(row.range.split(' - ')[1]);

                        return (
                          <tr key={index} className={isUserScore ? `${row.color} border-l-4 border-l-gray-900` : 'hover:bg-gray-50'}>
                            <td className="border border-gray-200 p-3 text-sm font-medium text-gray-900">
                              {row.range}
                              {isUserScore && <span className="ml-1 text-xs font-semibold">({totalScore})</span>}
                            </td>
                            <td className="border border-gray-200 p-3 text-sm text-gray-700">{row.percentage}</td>
                            <td className="border border-gray-200 p-3 text-sm font-semibold text-gray-900">{row.level}</td>
                            <td className="border border-gray-200 p-3 text-sm text-gray-700">{row.description}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  return null;
};

export default DepressionTest;

DepressionTest.getLayout = function PageLayout(page: React.ReactNode) {
  return <L1>{page}</L1>;
};