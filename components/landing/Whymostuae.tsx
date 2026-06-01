import React from "react";
import { Calendar, UserX, FileText, ClipboardList } from "lucide-react";

const Whymostuae: React.FC = () => {
  const problems = [
    {
      icon: Calendar,
      iconBg: "bg-pink-500",
      iconBgLight: "bg-pink-50",
      title: "Missed Appointments",
    },
    {
      icon: UserX,
      iconBg: "bg-orange-500",
      iconBgLight: "bg-orange-50",
      title: "No Follow-Ups",
    },
    {
      icon: FileText,
      iconBg: "bg-purple-500",
      iconBgLight: "bg-purple-50",
      title: "Billing Errors",
    },
    {
      icon: ClipboardList,
      iconBg: "bg-blue-500",
      iconBgLight: "bg-blue-50",
      title: "Too Much Paperwork",
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-12">
          Why Most Clinics Lose{" "}
          <span className="text-orange-500">AED 2,000+</span>{" "}
          Every Month
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all text-left"
            >
              <div className={`w-12 h-12 ${problem.iconBgLight} rounded-xl flex items-center justify-center mb-4`}>
                <div className={`w-8 h-8 ${problem.iconBg} rounded-lg flex items-center justify-center`}>
                  <problem.icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-800">{problem.title}</p>
            </div>
          ))}
        </div>

        <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#1565D8] to-[#0B3E91] text-white rounded-full text-sm font-semibold shadow-lg">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>All with Automated WhatsApp Reminders & Smart Billing</span>
        </div>
      </div>
    </section>
  );
};

export default Whymostuae;
