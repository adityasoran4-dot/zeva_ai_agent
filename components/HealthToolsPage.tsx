import React from "react";
import {
  Activity,
  Baby,
  CalendarDays,
  HeartPulse,
  Leaf,
} from "lucide-react";

const tools = [
  {
    title: "BMI Calculator",
    desc: "Calculate your body mass index",
    icon: Activity,
  },
  {
    title: "Pregnancy Calculator",
    desc: "Track your pregnancy journey",
    icon: Baby,
  },
  {
    title: "Period Tracker",
    desc: "Monitor your menstrual cycle",
    icon: CalendarDays,
  },
  {
    title: "Health Risk Checks",
    desc: "Assess your health risks",
    icon: HeartPulse,
  },
  {
    title: "Ayurveda Assessment",
    desc: "Discover your wellness type",
    icon: Leaf,
  },
];

export default function HealthToolsPage() {
  return (
    <section className="w-full bg-white pt-8 pb-20">
      <div className="max-w-6xl mx-auto px-4 text-center">
        {/* Heading */}
        <p className="text-blue-600 font-medium font-bold text-2xl">
          Health Tools & Calculators
        </p>
        <h2 className="mt-2 text-gray-900 text-xl ">
          Free wellness tools to track and improve your health journey
        </h2>

        {/* Cards */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {tools.map((tool) => (
            <div
              key={tool.title}
              className="border border-gray-200 rounded-2xl p-8 bg-white
              hover:shadow-lg transition-all duration-300"
            >
              <div className="mx-auto w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center">
                <tool.icon className="w-7 h-7 text-teal-700" />
              </div>

              <h3 className="mt-6 text-gray-900 font-semibold">
                {tool.title}
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                {tool.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
