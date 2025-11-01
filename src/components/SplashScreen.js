"use client";

import { useState, useEffect } from "react";

export default function SplashScreen({ onComplete }) {
  const [shouldShow, setShouldShow] = useState(false);
  const [particles, setParticles] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Check if user has seen the splash screen before (client-side only)
    const hasSeenSplash =
      typeof window !== "undefined"
        ? localStorage.getItem("hasSeenSplash")
        : null;

    if (hasSeenSplash) {
      // Skip animation if user has seen it before
      setShouldShow(false);
      onComplete?.();
      return;
    }

    // Show splash screen for first-time visitors
    setShouldShow(true);

    // Generate particles on client side only to avoid hydration issues
    const generatedParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 3,
    }));
    setParticles(generatedParticles);

    // Auto-hide after video duration (adjust timing as needed)
    const timer = setTimeout(() => {
      setShouldShow(false);
      if (typeof window !== "undefined") {
        localStorage.setItem("hasSeenSplash", "true");
      }
      onComplete?.();
    }, 5000); // 5 seconds - adjust based on your video length

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleVideoEnd = () => {
    setShouldShow(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("hasSeenSplash", "true");
    }
    onComplete?.();
  };

  const handleSkip = () => {
    setShouldShow(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("hasSeenSplash", "true");
    }
    onComplete?.();
  };

  // Don't render anything on server side or before mount
  if (!isMounted || !shouldShow) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-9999 bg-black flex items-center justify-center">
      {/* Background with subtle animation */}
      <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Video Container */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <video
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
          className="max-w-md w-full h-auto rounded-2xl shadow-2xl"
        >
          <source src="/Logo_Animation_Video_Generation.mp4" type="video/mp4" />
          {/* Fallback for browsers that don't support video */}
          <div className="w-64 h-64 bg-linear-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
            <span className="text-6xl font-bold text-white">E</span>
          </div>
        </video>

        {/* Loading indicator */}
        <div className="mt-8 flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-75"></div>
          <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse delay-150"></div>
        </div>

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="mt-6 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Skip →
        </button>
      </div>

      {/* Animated particles in background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
