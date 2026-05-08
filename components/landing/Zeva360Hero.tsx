import React, { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
const Zeva360Hero: React.FC = () => {
  const router = useRouter();
  const isIndia = router.pathname.includes('india');
  
  const openDemoPopup = () => {
    window.dispatchEvent(new CustomEvent("zeva:open-demo-popup"));
  };

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    clinicName: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    
    try {
      const { data } = await axios.post("/api/zeva-leads", {
        ...formData,
        source: "Hero Section Form",
        region: isIndia ? "India" : "UAE",
      });
      
      if (data.success) {
        setFormSuccess(true);
        setTimeout(() => {
          setFormSuccess(false);
          setFormData({ name: "", email: "", phone: "", clinicName: "" });
          const region = isIndia ? 'india' : 'uae';
          router.push(`/demo-thank-you?region=${region}`);
        }, 1000);
      }
    } catch (err: any) {
      console.error("Error submitting form:", err);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-[#1565D8] via-[#0B3E91] to-[#1565D8] text-white -mt-16 pt-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center py-12 lg:py-20">
          {/* Left Content */}
          <div className="space-y-6 lg:space-y-8">
            <div className="space-y-3 lg:space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Stop Losing Patients &
                <br className="hidden sm:block" />
                <span className="sm:hidden"> </span>
                Automate Your Clinic
                <br className="hidden sm:block" />
                <span className="sm:hidden"> </span>
                All in One Platform
              </h1>
              <p className="text-base sm:text-lg text-blue-100">
                Increase Appointments, Reduce No-Shows & Boost Revenue with Ease
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={openDemoPopup}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all text-base h-11"
              >
                <span>Book Free Demo</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {/* <button className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold rounded-lg transition-all text-base h-11">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Watch Quick Tour</span>
              </button> */}
            </div>
          </div>
          {/* Right - Demo Form */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 lg:p-4 border border-gray-200 dark:border-gray-700 w-full max-w-md lg:max-w-md shadow-2xl mx-auto lg:mx-0">
              {/* Header */}
              <div className="mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Book Your Demo
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  See Zeva in action. Schedule your personalized demo today.
                </p>
              </div>

 {/* Form */}
              {formSuccess ? (
                <div className="py-4 sm:py-6 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-1">Request Received!</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300">We'll contact you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-2 sm:space-y-3">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 sm:py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@clinic.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 sm:py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder={isIndia ? "+91 XXXXX XXXXX" : "+971 XX XXX XXXX"}
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 sm:py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>

                {/* Clinic Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                    Clinic Name
                  </label>
                  <input
                    type="text"
                    name="clinicName"
                    placeholder="Your clinic name"
                    value={formData.clinicName}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 sm:py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg py-2 sm:py-2.5 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading ? "Submitting..." : "Request Demo"}
                </button>
              </form>
              )}

              {/* Footer Text */}
              {!formSuccess && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2 sm:mt-3">
                  We'll contact you within 24 hours
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Zeva360Hero;
