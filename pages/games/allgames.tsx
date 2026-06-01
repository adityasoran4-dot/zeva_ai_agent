// pages/allgames.tsx
import { useRouter } from "next/router";
import Image from "next/image";
import React from "react";
import Head from "next/head";
import { games } from "../../components/CalculatorGames";

function AllGames() {
  const router = useRouter();

  const handleGameClick = (gameId: string) => {
    console.log(`Navigating to game: ${gameId}`);
    router.push(`/games/${gameId}`);
  };

  return (
    <>
      <Head>
        <title>Health Games by Zeva – Fun, Interactive Wellness & Fitness Games</title>
        <meta
          name="description"
          content="Play Zeva's free health games online to boost your fitness, immunity, and well-being. Enjoy interactive games like quizzes, exercises, FitFlip cards, and healthy food challenges anytime, 24/7."
        />
        <meta
          name="keywords"
          content="health games, wellness games, fitness games, interactive health games, online health games, free health games, exercise games, immunity booster games, healthy lifestyle games, mental health games, fun wellness activities, nutrition games, calorie burning games, healthy food games, fitness challenges, wellness quizzes, health quizzes, be fit games, interactive wellness tools, brain and body games, health tracker games, fun fitness exercises, family health games, health education games, online fitness challenges, health improvement games, lifestyle games, healthy habit games, stress relief games, wellbeing games"
        />
        <meta property="og:title" content="Health Games by Zeva – Fun, Interactive Wellness &amp; Fitness Games" />
        <meta
          property="og:description"
          content="Play Zeva's free health games online to boost your fitness, immunity, and well-being. Enjoy interactive games like quizzes, exercises, FitFlip cards, and healthy food challenges anytime, 24/7."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Health Games by Zeva – Fun, Interactive Wellness &amp; Fitness Games" />
        <meta
          name="twitter:description"
          content="Play Zeva's free health games online to boost your fitness, immunity, and well-being. Enjoy interactive games like quizzes, exercises, FitFlip cards, and healthy food challenges anytime, 24/7."
        />
        
        {/* Schema Markup - Health Games CollectionPage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              "name": "Health Games",
              "url": "https://zeva360.com/games/allgames",
              "description": "ZEVA Health Games offers free, interactive wellness games to learn, play, and improve fitness, nutrition awareness, and overall well-being.",
              "isPartOf": {
                "@type": "WebSite",
                "name": "ZEVA",
                "url": "https://zeva360.com"
              },
              "publisher": {
                "@type": "Organization",
                "name": "ZEVA",
                "url": "https://zeva360.com",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://zeva360.com/logo.png"
                }
              },
              "about": [
                {
                  "@type": "Thing",
                  "name": "Health Games"
                },
                {
                  "@type": "Thing",
                  "name": "Wellness Games"
                },
                {
                  "@type": "Thing",
                  "name": "Fitness Games"
                }
              ]
            })
          }}
        />
        
        {/* Schema Markup - Be Fit with Zeva WebPage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "Be Fit with Zeva",
              "url": "https://zeva360.com/health-games/games/fitwithzeva",
              "description": "Be Fit with Zeva is an interactive fitness game designed to encourage healthy habits, daily activity, and wellness awareness through engaging challenges.",
              "isPartOf": {
                "@type": "WebSite",
                "name": "ZEVA",
                "url": "https://zeva360.com"
              },
              "publisher": {
                "@type": "Organization",
                "name": "ZEVA",
                "url": "https://zeva360.com",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://zeva360.com/logo.png"
                }
              },
              "mainEntity": {
                "@type": "SoftwareApplication",
                "name": "Be Fit with Zeva",
                "applicationCategory": "HealthApplication",
                "operatingSystem": "Web",
                "description": "A wellness-focused health game that helps users stay active, track fitness goals, and build healthy lifestyle habits.",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD"
                }
              }
            })
          }}
        />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-red-500 to-red-600 py-8 px-4 sm:py-10 sm:px-6 md:py-12 md:px-8">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto">
          {/* Go to Home Button */}
          <div className="mb-6">
            <a
              href="/"
              className="inline-flex items-center gap-2 bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm text-white px-4 py-2 rounded-lg border border-white border-opacity-30 transition-all duration-200 hover:scale-105"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="font-medium text-gray-700"></span>
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left side - Title and description */}
            <div className="text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 tracking-tight">
                Health Games – Learn, Play, and Boost Your Well-Being
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-white text-opacity-90 leading-relaxed">
                Zeva brings you a collection of fun, interactive health games designed to improve your fitness, wellness, and overall well-being—anytime, anywhere.
              </p>
              <div className="mt-6 flex justify-center lg:justify-start">
                <div className="w-20 h-1 bg-white bg-opacity-60 rounded-full"></div>
              </div>
            </div>

            {/* Right side - Stats */}
            <div className="lg:justify-self-end">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl border border-white border-opacity-20 p-6 sm:p-8">
                <div className="grid grid-cols-3 gap-4 sm:gap-6">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-700 mb-1">
                      {games.length}
                    </div>
                    <div className="text-gray-700 text-opacity-80 text-xs sm:text-sm">
                      Health Games
                    </div>
                  </div>
                  <div className="text-center border-l border-r border-white border-opacity-20">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-700 mb-1">
                      100%
                    </div>
                    <div className="text-gray-700 text-opacity-80 text-xs sm:text-sm">
                      Free to Play
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-700 mb-1">
                      24/7
                    </div>
                    <div className="text-gray-700 text-opacity-80 text-xs sm:text-sm">
                      Available
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Games Grid Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {games.map((game) => {
            const Icon = game.icon;
            return (
              <div
                key={game.id}
                className="group relative bg-slate-800 rounded-2xl border border-slate-700 hover:border-red-500 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl overflow-hidden cursor-pointer"
                onClick={() => handleGameClick(game.id)}
              >
                {/* Image Container */}
                <div className="relative overflow-hidden rounded-t-2xl">
                  <Image
                    src={game.image}
                    alt={game.title}
                    width={400}
                    height={176}
                    className="w-full h-36 sm:h-40 md:h-44 object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>

                  {/* Play button on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center shadow-xl">
                      <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>

                  {/* Icon Badge */}
                  <div className="absolute top-3 right-3 w-10 h-10 bg-slate-900 bg-opacity-80 backdrop-blur-sm rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Icon className="text-red-500" size={18} />
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 md:p-6">
                  <div className="flex items-start mb-3">
                    <div className="w-8 h-8 bg-red-500 bg-opacity-10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <Icon className="text-red-500" size={16} />
                    </div>
                    <h2 className="text-white text-base sm:text-lg font-bold leading-tight group-hover:text-red-500 transition-colors duration-300">
                      {game.title}
                    </h2>
                  </div>

                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4 line-clamp-3">
                    {game.description}
                  </p>

                  {/* Action Button */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleGameClick(game.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      Play Now
                    </button>
                    <div className="flex items-center text-xs text-slate-500">
                      <svg className="w-4 h-4 mr-1 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                      </svg>
                      Free
                    </div>
                  </div>
                </div>

                {/* Hover Border Effect */}
                <div className="absolute inset-0 rounded-2xl border-2 border-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </>
  );
}

AllGames.getLayout = function PageLayout(page: React.ReactNode) {
  return page;
};

export default AllGames;