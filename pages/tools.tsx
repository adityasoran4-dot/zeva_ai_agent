import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Activity,
  Baby,
  CalendarDays,
  HeartPulse,
  Leaf,
  Calculator,
  Droplets,
  Flame,
  Brain,
  Scale,
} from 'lucide-react';

const Tools: React.FC = () => {
  const tools = [
    {
      title: "BMI Calculator",
      desc: "Calculate your body mass index",
      icon: Activity,
      href: "/calculator/bmi",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Pregnancy Calculator",
      desc: "Track your pregnancy journey",
      icon: Baby,
      href: "/calculator/pregnancy-and-ovulation/pregnancy",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    {
      title: "Period Tracker",
      desc: "Monitor your menstrual cycle",
      icon: CalendarDays,
      href: "/calculator/pregnancy-and-ovulation/trackperiods",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Calorie Counter",
      desc: "Track your daily calorie intake",
      icon: Flame,
      href: "/calculator/calorie-counter",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "BMR & TDEE Calculator",
      desc: "Calculate your metabolic rate",
      icon: Scale,
      href: "/calculator/bmr-tdee",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Water Intake Calculator",
      desc: "Track your daily water consumption",
      icon: Droplets,
      href: "/calculator/water",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
    {
      title: "Heart Rate Calculator",
      desc: "Calculate your target heart rate zones",
      icon: HeartPulse,
      href: "/calculator/heartrate",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Depression Test",
      desc: "Assess your mental health",
      icon: Brain,
      href: "/calculator/depression-test",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Breath Hold Test",
      desc: "Test your lung capacity",
      icon: Calculator,
      href: "/calculator/breathhold",
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      title: "Ayurveda Assessment",
      desc: "Discover your wellness type",
      icon: Leaf,
      href: "/calculator/allcalc",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
  ];

  return (
    <>
      <Head>
        <title>Health Tools & Calculators - ZEVA Healthcare Platform</title>
        <meta
          name="description"
          content="Access free health tools and calculators on ZEVA. BMI calculator, pregnancy tracker, calorie counter, period tracker, and more wellness tools."
        />
        <meta name="robots" content="index, follow" />
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Health Tools & Calculators
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Free wellness tools to track and improve your health journey
            </p>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.title}
                  href={tool.href}
                  className="group"
                >
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-teal-600 hover:shadow-lg transition-all duration-300 h-full flex flex-col items-center text-center">
                    <div className={`w-16 h-16 ${tool.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-8 h-8 ${tool.color}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {tool.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Additional Info */}
          <div className="mt-16 bg-white rounded-lg shadow-lg p-8 md:p-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Why Use Health Tools?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Track Your Progress</h3>
                <p className="text-sm text-gray-600">
                  Monitor your health metrics and see improvements over time
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Set Health Goals</h3>
                <p className="text-sm text-gray-600">
                  Use calculators to set realistic health and fitness goals
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💡</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Make Informed Decisions</h3>
                <p className="text-sm text-gray-600">
                  Get insights to make better health and wellness choices
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-12 text-center">
            <Link
              href="/calculator/allcalc"
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-teal-700 transition"
            >
              View All Calculators
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Tools;


