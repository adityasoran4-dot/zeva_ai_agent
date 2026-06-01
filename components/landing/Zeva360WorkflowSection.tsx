import React from "react";
import { Calendar, CheckCircle } from "lucide-react";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const Zeva360WorkflowSection: React.FC = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          See Zeva360 in Action
        </h2>
        <p className="text-orange-500 text-sm font-semibold mb-12">
          Recover Lost Patients in Seconds!
        </p>

        <div className="bg-white rounded-3xl shadow-2xl p-10 md:p-14">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6 items-center">
            {/* Step 1: Missed Appointment */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                <Calendar className="w-10 h-10 text-white" />
              </div>
              <p className="font-bold text-gray-900 text-lg mb-2">Missed Appointment</p>
              <p className="text-sm text-gray-500 font-medium">Patient doesn't show up</p>
            </div>

            {/* Arrow 1 */}
            <div className="hidden md:flex justify-center items-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="md:hidden flex justify-center my-2">
              <svg className="w-6 h-6 text-blue-600 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>

            {/* Step 2: Auto WhatsApp */}
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                  <WhatsAppIcon className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm"></div>
              </div>
              <p className="font-bold text-gray-900 text-lg mb-2">Auto WhatsApp Sent</p>
              <p className="text-sm text-gray-500 font-medium">Instant reminder sent</p>
            </div>

            {/* Arrow 2 */}
            <div className="hidden md:flex justify-center items-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="md:hidden flex justify-center my-2">
              <svg className="w-6 h-6 text-blue-600 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>

            {/* Step 3: Patient Rebooked */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <p className="font-bold text-gray-900 text-lg mb-2">Patient Rebooked</p>
              <p className="text-sm text-gray-500 font-medium">Revenue recovered!</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Zeva360WorkflowSection;
