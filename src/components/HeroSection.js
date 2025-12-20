"use client";
import { memo } from "react";

// Hero Section Component - Memoized
const HeroSection = memo(({ router }) => (
    <section className="relative z-10 text-center py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
    {/* Christmas Background Overlay */}
    <div className="absolute inset-0 pointer-events-none">
      {/* Festive gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-transparent to-green-900/20"></div>
      
      {/* Warm glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
      
      {/* Subtle sparkle pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }}></div>
    </div>

    {/* Animated Snowflakes Background */}
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute text-white/40 animate-snowfall"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 20}%`,
            fontSize: `${12 + Math.random() * 12}px`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${8 + Math.random() * 7}s`,
          }}
        >
          ❄️
        </div>
      ))}
    </div>

    {/* Christmas Ornament Decorations */}
    <div className="absolute top-4 left-4 sm:left-8 text-3xl sm:text-4xl animate-float opacity-80">🎄</div>
    <div className="absolute top-4 right-4 sm:right-8 text-3xl sm:text-4xl animate-float opacity-80" style={{ animationDelay: '1s' }}>🎁</div>
    <div className="absolute bottom-8 left-8 hidden sm:block text-2xl animate-pulse opacity-60">⭐</div>
    <div className="absolute bottom-8 right-8 hidden sm:block text-2xl animate-pulse opacity-60" style={{ animationDelay: '0.5s' }}>✨</div>

    {/* Christmas Tree Lights - Left Side */}
    <div className="absolute left-0 top-1/4 hidden lg:block pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <div
          key={`left-${i}`}
          className="absolute rounded-full blur-md animate-pulse"
          style={{
            width: '12px',
            height: '12px',
            top: `${i * 80}px`,
            left: `${20 + Math.sin(i) * 30}px`,
            backgroundColor: ['#ff0000', '#00ff00', '#ffff00', '#ff00ff', '#00ffff'][i % 5],
            opacity: 0.6,
            animationDelay: `${i * 0.3}s`,
            animationDuration: '2s',
            boxShadow: `0 0 20px ${['#ff0000', '#00ff00', '#ffff00', '#ff00ff', '#00ffff'][i % 5]}`
          }}
        />
      ))}
    </div>

    {/* Christmas Tree Lights - Right Side */}
    <div className="absolute right-0 top-1/4 hidden lg:block pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <div
          key={`right-${i}`}
          className="absolute rounded-full blur-md animate-pulse"
          style={{
            width: '12px',
            height: '12px',
            top: `${i * 80}px`,
            right: `${20 + Math.sin(i) * 30}px`,
            backgroundColor: ['#00ff00', '#ff0000', '#00ffff', '#ffff00', '#ff00ff'][i % 5],
            opacity: 0.6,
            animationDelay: `${i * 0.3 + 0.15}s`,
            animationDuration: '2s',
            boxShadow: `0 0 20px ${['#00ff00', '#ff0000', '#00ffff', '#ffff00', '#ff00ff'][i % 5]}`
          }}
        />
      ))}
    </div>

    <div className="max-w-4xl mx-auto relative z-10">
      {/* Christmas Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500/20 to-green-500/20 backdrop-blur-md border border-red-300/30 mb-4 animate-fade-in">
        <span className="text-xl">🎅</span>
        <span className="text-sm font-semibold text-white">Holiday Season Special</span>
        <span className="text-xl">🎄</span>
      </div>

      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-3 sm:mb-4 animate-fade-in-up leading-tight drop-shadow-2xl">
        <span className="bg-gradient-to-r from-red-400 via-white to-green-400 bg-clip-text text-transparent">
          Celebrate the Season
        </span>
        <br className="lg:hidden" />
        <span className="text-white">
          {" "}with Amazing Events
        </span>
      </h1>

      {/* Merry Christmas - Subtle & Stylish */}
      <div className="mb-4 animate-fade-in-up animation-delay-300">
        <p className="text-2xl sm:text-3xl md:text-4xl font-serif italic text-white/30 tracking-wider" style={{ 
          fontFamily: "'Brush Script MT', cursive",
          textShadow: '0 0 20px rgba(255, 255, 255, 0.1), 0 0 40px rgba(255, 215, 0, 0.1)'
        }}>
          Merry Christmas
        </p>
      </div>
      
      <p className="text-base sm:text-lg md:text-xl text-gray-100 mb-6 sm:mb-8 max-w-2xl mx-auto animate-fade-in-up animation-delay-300 px-4 drop-shadow-lg">
        🎁 Join the festive spirit! Discover magical holiday events, winter celebrations,
        and unforgettable experiences this Christmas season ⛄
      </p>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-2xl mx-auto mb-6 sm:mb-8 animate-fade-in-up animation-delay-600 px-4">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="🎄 Search holiday events, concerts, parties..."
            className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-full bg-white/10 backdrop-blur-md border-2 border-red-300/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all text-sm sm:text-base shadow-lg"
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xl">
            🎁
          </div>
        </div>
        <button className="bg-gradient-to-r from-red-600 via-red-500 to-green-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full hover:from-red-700 hover:via-red-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-xl font-semibold text-sm sm:text-base w-full sm:w-auto border border-white/20">
          Search 🔔
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-fade-in-up animation-delay-900 px-4">
        <button
          onClick={() => router.push("/events")}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-xl text-sm sm:text-base border border-white/20"
        >
          🎄 Browse Holiday Events
        </button>
        <button
          onClick={() => router.push("/about")}
          className="border-2 border-yellow-300/60 bg-yellow-500/10 text-yellow-100 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold hover:bg-yellow-400 hover:text-gray-900 hover:border-yellow-400 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base backdrop-blur-sm shadow-lg"
        >
          ⭐ Learn More
        </button>
      </div>
    </div>
  </section>

  /* {{{Default Hero Section}}} */
  /*
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
  */

));

HeroSection.displayName = 'HeroSection';

export default HeroSection;
