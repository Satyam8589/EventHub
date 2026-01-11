"use client";
import { memo } from "react";

// Hero Section Component - Memoized
const HeroSection = memo(({ router }) => (

  /* {{{Default Hero Section}}} */
  
  <section className="relative z-10 text-center py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
    <div className="max-w-4xl mx-auto relative z-10">
      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-4 sm:mb-6 animate-fade-in-up leading-tight drop-shadow-2xl">
        Discover Amazing Events Near You
      </h1>
      <p className="text-base sm:text-lg md:text-xl text-gray-100 mb-6 sm:mb-8 max-w-2xl mx-auto animate-fade-in-up animation-delay-300 px-4 drop-shadow-lg">
        Join thousands of people experiencing the best events in music, food,
        technology, and community. Book your next adventure today!
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-2xl mx-auto mb-8 sm:mb-12 animate-fade-in-up animation-delay-600 px-4">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search events, artists, venues..."
            className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base"
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </div>
        </div>
        <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl font-semibold text-sm sm:text-base w-full sm:w-auto">
          Search
        </button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-fade-in-up animation-delay-900 px-4">
        <button
          onClick={() => router.push("/events")}
          className="bg-white text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl text-sm sm:text-base"
        >
          Browse Events
        </button>
        <button
          onClick={() => router.push("/about")}
          className="border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base backdrop-blur-sm"
        >
          Learn More
        </button>
      </div>
    </div>
  </section>

));

HeroSection.displayName = 'HeroSection';

export default HeroSection;
