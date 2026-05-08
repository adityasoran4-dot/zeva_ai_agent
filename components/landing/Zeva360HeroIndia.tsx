import React from "react";

const Zeva360HeroIndia: React.FC = () => {
  const openDemoPopup = () => {
    window.dispatchEvent(new CustomEvent("zeva:open-demo-popup"));
  };

  return (
    <section className="relative bg-gradient-to-br from-[#1565D8] via-[#0B3E91] to-[#1565D8] text-white -mt-16 pt-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center py-16 lg:py-24">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Stop Losing Patients &
                <br />
                Automate Your Clinic
                <br />
                All in One Platform
              </h1>
              <p className="text-lg text-blue-100 max-w-xl">
                Increase Appointments, Reduce No-Shows & Boost Revenue with Ease
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
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

          {/* Right Visual */}
          <div className="relative flex justify-end lg:justify-end lg:pl-8">
            <div className="relative w-full max-w-xl">
              <img
                src="/landingpage1.jpg"
                alt="Zeva 360 Platform Dashboard"
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Zeva360HeroIndia;
