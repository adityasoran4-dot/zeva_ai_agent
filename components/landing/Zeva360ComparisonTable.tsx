import React from "react";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

const Zeva360ComparisonTable: React.FC = () => {
  const features = [
    {
      feature: "Advanced WhatsApp Automation",
      zeva: true,
      others: "limited",
    },
    {
      feature: "Patient Retention Tools",
      zeva: true,
      others: false,
    },
    {
      feature: "Growth Analytics",
      zeva: true,
      others: false,
    },
    {
      feature: "Automated Follow-ups",
      zeva: true,
      others: "limited",
    },
    {
      feature: "Multi-clinic Management",
      zeva: true,
      others: false,
    },
    {
      feature: "Indian Payment Integration",
      zeva: true,
      others: "limited",
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Why Choose Zeva360?
          </h2>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-3 bg-blue-600  text-white font-semibold">
            <div className="px-6 py-4 text-sm">Features</div>
            <div className="px-6 py-4 text-sm text-center bg-orange-500">Zeva360</div>
            <div className="px-6 py-4 text-sm text-center">Others</div>
          </div>

          {/* Table Rows */}
          {features.map((item, index) => (
            <div
              key={index}
              className={`grid grid-cols-3 items-center border-b border-gray-200 ${
                index % 2 === 0 ? "bg-white" : "bg-gray-50"
              }`}
            >
              <div className="px-6 py-4 text-sm font-medium text-gray-800">
                {item.feature}
              </div>
              <div className="px-6 py-4 flex justify-center items-center">
                <div className="inline-flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-semibold text-green-700">Yes</span>
                </div>
              </div>
              <div className="px-6 py-4 flex justify-center items-center">
                {item.others === true ? (
                  <div className="inline-flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-semibold text-green-700">Yes</span>
                  </div>
                ) : item.others === false ? (
                  <div className="inline-flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-semibold text-red-700">No</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-semibold text-orange-700">Limited</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Footer */}
          <div className="px-6 py-6 text-center bg-gradient-to-r from-blue-50 to-indigo-50">
            <p className="text-sm text-gray-700 mb-4">
              <span className="font-semibold text-blue-700">Zeva360</span> gives you everything you need to grow your clinic
            </p>
            {/* <button className="inline-flex items-center px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold text-sm transition-all">
              See All Features
            </button> */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Zeva360ComparisonTable;
