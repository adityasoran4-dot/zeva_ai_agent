import React from "react";
import { MessageCircle, CreditCard, FileText, CheckCircle } from "lucide-react";

const Zeva360SolutionsSection: React.FC = () => {
  const solutions = [
    {
      icon: MessageCircle,
      iconBg: "bg-green-500",
      bgColor: "bg-green-50",
      title: "Auto WhatsApp Reminders",
      description: "Send automated appointment reminders, follow-ups, and confirmations via WhatsApp",
    },
    {
      icon: CreditCard,
      iconBg: "bg-orange-500",
      bgColor: "bg-orange-50",
      title: "Easy Billing & Payments",
      description: "Generate invoices instantly, track payments, and reduce billing errors by 90%",
    },
    {
      icon: FileText,
      iconBg: "bg-blue-600",
      bgColor: "bg-blue-50",
      title: "Patient Records & Reports",
      description: "Secure digital records, treatment history, and detailed analytics at your fingertips",
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            All-in-One Solutions for Your Clinic
          </h2>
          <p className="text-sm text-gray-600">Simple, Fast & Secure</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {solutions.map((solution, index) => (
            <div
              key={index}
              className={`${solution.bgColor} rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all min-h-[280px] flex flex-col justify-between`}
            >
              <div>
                <div className={`w-14 h-14 ${solution.iconBg} rounded-xl flex items-center justify-center mb-5`}>
                  <solution.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{solution.title}</h3>
                <p className="text-base text-gray-600 leading-relaxed">{solution.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Feature badges */}
        <div className="flex flex-wrap justify-center gap-5">
          <div className="inline-flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-full text-sm text-gray-700 shadow-sm">
            <CheckCircle className="w-4 h-5 text-green-500" />
            <span>No Setup Fee</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-full text-sm text-gray-700 shadow-sm">
            <CheckCircle className="w-4 h-5 text-green-500" />
            <span>Easy Migration</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-full text-sm text-gray-700 shadow-sm">
            <CheckCircle className="w-4 h-5 text-green-500" />
            <span>24/7 Support</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Zeva360SolutionsSection;
