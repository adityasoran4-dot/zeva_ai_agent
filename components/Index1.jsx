import React from 'react';

import CalculatorGames from './CalculatorGames';
import WhyChoose from './WhyChoose';
import OnePlatformSection from './OnePlatformSection';
import FeaturedClinicsDoctors from './FeaturedClinicsDoctors';
import HomeSearchSection from './HomeSearchSection';
import SocialProofPage from './SocialProofPage';
import Career from './Career';
import HealthCare from './HealthCare';
import ReadyGet from './ReadyGet';
import TelemedicinePromoSection from './TelemedicinePromoSection';

const HealthRiskComponent = () => {

    return (
        <div className="w-full bg-white py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* 1. Platform Introduction - Show what ZEVA is */}
                 <div className="w-full mb-8">
                    <HomeSearchSection />
                </div>
                
                
                <div className="w-full mb-8">
                    <OnePlatformSection embedded />
                </div>

                {/* 2. Featured Clinics & Doctors - Show available providers */}
                <div className="w-full mb-8">
                    <FeaturedClinicsDoctors />
                </div>

                {/* 3. Why Choose Us - Build trust and credibility */}
                <div className="w-full">
                    <WhyChoose />
                </div>

                {/* 4. Telemedicine Section - Show online consultation feature */}
              

                {/* 5. Healthcare Account Features - Show account benefits */}
              

                {/* 6. Health Tools - Show calculators and health tools */}
                {/* <div className="w-full mb-8">
                    <HealthToolsPage />
                </div> */}

                {/* 7. Calculator Games - Interactive health games */}
              <CalculatorGames />

                {/* 8. Social Proof - Testimonials, stats, and trust indicators */}
               <SocialProofPage />
              <div className="w-full mt-18 mb-8">
                <Career />
               </div>
             <div className="w-full mt-10 mb-8">
                <HealthCare />
               </div>
                {/* 9. Latest Jobs - Career opportunities */}
             

                {/* 10. Ready to Get Started - Final CTA for account creation */}
                <div className="w-full  mb-8">
                    <ReadyGet />
                </div>
            </div>

            <style jsx>{`
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
       
    );
};

export default HealthRiskComponent;