import React, { useState, useRef, useEffect } from 'react';
import {
  Droplet, Dumbbell, Scale, Activity, Wind, Apple, ArrowRight,
  ChevronLeft, ChevronRight, Gamepad2, Target, Brain, Heart, BookOpen
} from 'lucide-react';



const Link = ({ href, onClick, className, children }) => (
  <a href={href} onClick={onClick} className={className}>
    {children}
  </a>
);

export const calculators = [
  {
    id: 'pregnancy-and-ovulation/pregnancy&ovulation',
    title: 'Pregnancy & Periods Tracker',
    description: 'Free Pregnancy Calculator & Ovulation Calendar to track your cycle',
    icon: Droplet,
    bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600',
    category: 'Women Health',
    image: 'https://images.unsplash.com/photo-1493894473891-10fc1e5dbd22?w=400&h=200&fit=crop&auto=format'
  },
  {
    id: 'depression-test',
    title: 'Depression Test Calculator',
    description: 'Begin a gentle test to understand depression signs',
    icon: Brain,
    bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
    category: 'Mental Health',
    image: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400&h=200&fit=crop"
  },
  {
    id: 'bmi',
    title: 'BMI Calculator',
    description: 'Calculate your Body Mass Index and understand your weight category',
    icon: Scale,
    bgColor: 'bg-gradient-to-br from-teal-500 to-teal-600',
    category: 'Body Metrics',
    image: 'https://images.unsplash.com/photo-1434596922112-19c563067271?w=400&h=200&fit=crop'
  },
  {
    id: 'bmr-tdee',
    title: 'BMR-TDEE Calculator',
    description: 'Calculate Basal Metabolic Rate & Total Daily Energy Expenditure',
    icon: Activity,
    bgColor: 'bg-gradient-to-br from-orange-500 to-orange-600',
    category: 'Nutrition',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=200&fit=crop'
  },
  {
    id: 'breathhold',
    title: 'Breath Hold Calculator',
    description: 'Track your breath holding capacity and improve lung health',
    icon: Wind,
    bgColor: 'bg-gradient-to-br from-pink-500 to-pink-600',
    category: 'Respiratory',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=200&fit=crop'
  },
  {
    id: 'calorie-counter',
    title: 'Calorie Count Calculator',
    description: 'Track your daily calorie intake and maintain a healthy diet',
    icon: Apple,
    bgColor: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    category: 'Nutrition',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=200&fit=crop'
  },
  {
    id: 'heartrate',
    title: 'Heart Rate Monitor',
    description: 'Monitor your heart rate and cardiovascular health',
    icon: Activity,
    bgColor: 'bg-gradient-to-br from-red-500 to-red-600',
    category: 'Cardio Health',
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop'
  },
  {
    id: 'water',
    title: 'Water Intake Tracker',
    description: 'Track your daily water consumption for optimal hydration',
    icon: Apple,
    bgColor: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
    category: 'Hydration',
    image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&h=200&fit=crop'
  }
];

export const games = [
  {
    id: 'fitwithzeva',
    title: 'Be Fit with Zeva',
    description: 'Fun Exercises to Boost Immunity & Strength',
    icon: Heart,
    bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600',
    category: 'Fitness',
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=200&fit=crop'
  },
  {
    id: 'quiz',
    title: 'Health Quiz Challenge',
    description: 'Test Your Health Knowledge Online',
    icon: BookOpen,
    bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
    category: 'Puzzle',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=200&fit=crop'
  },
  {
    id: 'flipcards',
    title: 'FitFlip Cards',
    description: 'Fun Exercise Game to Burn Calories Fast',
    icon: Dumbbell,
    bgColor: 'bg-gradient-to-br from-teal-500 to-teal-600',
    category: 'Action',
    image: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=400&h=200&fit=crop'
  },
  {
    id: 'HealthyFood',
    title: 'Healthy Food Picker Game',
    description: 'Smash junk, grab greens, beat the clock!',
    icon: Target,
    bgColor: 'bg-gradient-to-br from-orange-500 to-orange-600',
    category: 'RPG',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=200&fit=crop'
  }
];

const HealthCalculatorApp = () => {
  const sliderRef = useRef(null);
  const gamesSliderRef = useRef(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    function scrollToSectionIfHash() {
      if (window.location.hash === '#games-section' && sectionRef.current) {
        sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    scrollToSectionIfHash();
    window.addEventListener('hashchange', scrollToSectionIfHash);
    setTimeout(scrollToSectionIfHash, 100);
    return () => window.removeEventListener('hashchange', scrollToSectionIfHash);
  }, []);

  const scrollLeft = () => {
    if (sliderRef.current) {
      const scrollAmount = sliderRef.current.clientWidth;
      sliderRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      const scrollAmount = sliderRef.current.clientWidth;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };



  const getBadgeStyles = (badge) => {
    switch (badge) {
      case 'Hot': return 'bg-red-500';
      case 'New': return 'bg-emerald-500';
      case 'Trending': return 'bg-blue-500';
      case 'Popular': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-white mt-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* Calculators Section */}
        <section ref={sectionRef} id="games-section" className="mb-12 sm:mb-16">
          <div className="text-center mb-6 sm:mb-8">
           
             <span className="inline-block rounded-full bg-teal-50 px-5 py-2 text-sm font-medium text-teal-700">
          Free Health Tools
        </span>

       <p className="text-blue-700 text-[20px] font-medium text-4xl mt-6">
         Health Tools & Calculators
          </p>
        <h1 className="text-gray-600 text-[24px] text-base font-normal mt-4 " >
            Free wellness tools to track and improve your health journey
          </h1>
          </div>

          <div className="relative">
            <button 
              onClick={scrollLeft} 
              className="hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 bg-white shadow-md rounded-full p-2 text-gray-700 hover:bg-gray-50 hover:shadow-lg transition-all border border-gray-200"
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
            <button 
              onClick={scrollRight} 
              className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 bg-white shadow-md rounded-full p-2 text-gray-700 hover:bg-gray-50 hover:shadow-lg transition-all border border-gray-200"
              aria-label="Scroll right"
            >
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>

            <div 
              ref={sliderRef} 
              className="flex overflow-x-auto gap-4 pb-4 scroll-smooth snap-x snap-mandatory hide-scrollbar"
            >
              {calculators.map((calc) => {
                const IconComponent = calc.icon;
                return (
                  <Link
                    key={calc.id}
                    href={`/calculator/${calc.id}#games-section`}
                    className="flex-shrink-0 w-[280px] sm:w-[calc((100%-16px)/2)] md:w-[calc((100%-32px)/3)] lg:w-[calc((100%-48px)/4)] snap-start"
                  >
                    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 p-6 min-h-[220px] h-full group hover:border-gray-300 overflow-hidden cursor-pointer flex flex-col items-center text-center">
                      <div className="h-14 w-14 rounded-xl bg-teal-50 flex items-center justify-center mb-3">
                        <IconComponent className="text-teal-700" size={24} strokeWidth={2} />
                      </div>
                      <h3 className="font-semibold text-gray-900 text-base mb-1 leading-tight line-clamp-2">{calc.title}</h3>
                      <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">{calc.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="text-center mt-6 md:hidden">
            <Link 
              href="/calculator/allcalc#games-section" 
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              View All Calculators 
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* Games Section */}
        <section className="mb-12 mt-9 sm:mb-16">
          <div className="text-center mb-6 sm:mb-8">
                     <span className="inline-block rounded-full bg-teal-50 px-5 py-2 text-sm font-medium text-teal-700">
          Health Games
        </span>

       <p className="text-blue-700 text-[20px] font-medium text-4xl mt-6">
        Learn through interactive play
          </p>
        <h1 className="text-gray-600 text-[24px] text-base font-normal mt-4 " >
           Discover healthy habits with fun interactive experiences
          </h1>
          </div>

          <div className="relative">


            <div 
              ref={gamesSliderRef} 
              className="flex overflow-x-auto gap-4 pb-4 scroll-smooth snap-x snap-mandatory hide-scrollbar"
            >
              {games.map((game) => {
                const IconComponent = game.icon;
                return (
                  <Link
                    key={game.id}
                    href={`/games/${game.id}#games-section`}
                    className="flex-shrink-0 w-[280px] sm:w-[calc((100%-16px)/2)] md:w-[calc((100%-32px)/3)] lg:w-[calc((100%-48px)/4)] snap-start"
                  >
                    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 p-6 min-h-[220px] h-full group hover:border-gray-300 overflow-hidden cursor-pointer flex flex-col items-center text-center">
                      <div className="h-14 w-14 rounded-xl bg-teal-50 flex items-center justify-center mb-3">
                        <IconComponent className="text-teal-700" size={24} strokeWidth={2} />
                      </div>
                      <h3 className="font-semibold text-gray-900 text-base mb-1 leading-tight line-clamp-2">{game.title}</h3>
                      <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">{game.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="text-center mt-6 md:hidden">
            <Link 
              href="/games/allgames#games-section" 
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              View All Games 
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

      </div>

      <style jsx>{`
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default HealthCalculatorApp;
