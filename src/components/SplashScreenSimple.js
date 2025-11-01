"use client";

import { useState, useEffect } from "react";

export default function SplashScreenSimple({ onComplete }) {
  const [shouldRender, setShouldRender] = useState(false);
  const [hasSeenSplash, setHasSeenSplash] = useState(true); // Default to true to prevent server rendering
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    // Only run on client side
    const splash = localStorage.getItem("hasSeenSplash");

    if (!splash) {
      setHasSeenSplash(false);
      setShouldRender(true);

      // Auto-hide after 8 seconds (increased duration)
      const timer = setTimeout(() => {
        localStorage.setItem("hasSeenSplash", "true");
        setShouldRender(false);
        onComplete?.();
      }, 8000);

      return () => clearTimeout(timer);
    } else {
      onComplete?.();
    }
  }, [onComplete]);

  const handleSkip = () => {
    localStorage.setItem("hasSeenSplash", "true");
    setShouldRender(false);
    onComplete?.();
  };

  const handleVideoLoaded = () => {
    setVideoLoaded(true);
  };

  // Don't render anything if user has seen splash or not ready
  if (hasSeenSplash || !shouldRender) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-9999 bg-black">
      {/* Full Screen Video */}
      <video
        autoPlay
        muted
        playsInline
        onEnded={handleSkip}
        onLoadedData={handleVideoLoaded}
        className="absolute inset-0 w-full h-full object-cover"
        poster="" // Prevents default poster
      >
        <source src="/Logo_Animation_Video_Generation.mp4" type="video/mp4" />
      </video>

      {/* Fallback Background (shown if video fails to load or while loading) */}
      <div
        className={`absolute inset-0 bg-linear-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center transition-opacity duration-1000 ${
          videoLoaded ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="w-64 h-64 bg-linear-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
          <div className="text-white text-6xl font-bold">EventHub</div>
        </div>
      </div>

      {/* Skip button - positioned over the video */}
      <div className="absolute bottom-8 right-8 z-10">
        <button
          onClick={handleSkip}
          className="px-6 py-3 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-black/70 transition-all duration-300 border border-white/20 shadow-lg"
        >
          Skip →
        </button>
      </div>

      {/* Loading indicator - only show while video is loading */}
      <div
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 transition-opacity duration-500 ${
          videoLoaded ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-white/50 rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-white/50 rounded-full animate-pulse delay-75"></div>
          <div className="w-3 h-3 bg-white/50 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    </div>
  );
}
