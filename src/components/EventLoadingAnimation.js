"use client";

import React from "react";

export default function EventLoadingAnimation({ message = "Loading Event..." }) {
  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-slate-950 flex flex-col items-center justify-center px-4 py-12">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/20 via-purple-600/20 to-pink-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-10 left-1/4 w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-10 right-1/4 w-[350px] h-[350px] bg-violet-600/15 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: "24px 24px"
        }}
      ></div>

      <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col items-center">
        {/* Futuristic Glowing Pulse & Icon Animation */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Outer Rotating Glow Ring */}
          <div className="w-24 h-24 rounded-full border-2 border-dashed border-blue-400/40 animate-[spin_8s_linear_infinite]"></div>
          
          {/* Middle Counter-rotating Gradient Ring */}
          <div className="absolute w-20 h-20 rounded-full border-2 border-t-purple-400 border-r-pink-400 border-b-transparent border-l-cyan-400 animate-[spin_2.5s_linear_infinite]"></div>
          
          {/* Inner Glowing Orb */}
          <div className="absolute w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 shadow-[0_0_35px_rgba(99,102,241,0.6)] flex items-center justify-center animate-bounce">
            <svg
              className="w-7 h-7 text-white drop-shadow-md"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
          </div>

          {/* Sparkles Floating Around */}
          <span className="absolute -top-1 -right-2 text-yellow-300 text-xs animate-ping">✦</span>
          <span className="absolute -bottom-2 -left-2 text-cyan-300 text-xs animate-pulse">✦</span>
        </div>

        {/* Loading Text with Gradient & Animated Subtitle */}
        <div className="text-center mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-300 to-pink-400 bg-clip-text text-transparent tracking-tight">
            {message}
          </h2>
          <p className="text-slate-400 text-sm flex items-center justify-center gap-1.5 font-medium">
            <span>Fetching event details & tickets</span>
            <span className="inline-flex">
              <span className="animate-bounce delay-100 font-bold">.</span>
              <span className="animate-bounce delay-200 font-bold">.</span>
              <span className="animate-bounce delay-300 font-bold">.</span>
            </span>
          </p>
        </div>

        {/* Shimmering Event Skeleton Card */}
        <div className="w-full bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-4">
          {/* Shimmer Light Bar */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

          {/* Banner Skeleton */}
          <div className="w-full h-36 sm:h-44 rounded-xl bg-slate-800/80 animate-pulse relative overflow-hidden flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-500">
              <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="absolute top-3 right-3 w-16 h-6 rounded-full bg-slate-700/70 animate-pulse"></div>
          </div>

          {/* Title & Category Skeletons */}
          <div className="space-y-2 pt-1">
            <div className="flex gap-2">
              <div className="h-5 w-20 bg-blue-500/20 rounded-full animate-pulse"></div>
              <div className="h-5 w-24 bg-purple-500/20 rounded-full animate-pulse"></div>
            </div>
            <div className="h-6 w-4/5 bg-slate-700/70 rounded-lg animate-pulse"></div>
            <div className="h-4 w-3/5 bg-slate-800 rounded-md animate-pulse"></div>
          </div>

          {/* Metadata Chips Skeleton (Date, Location, Capacity) */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <div className="h-10 bg-slate-800/60 rounded-xl p-2.5 flex items-center gap-2 border border-white/5">
              <div className="w-5 h-5 rounded-md bg-blue-500/30 animate-pulse"></div>
              <div className="h-3 w-20 bg-slate-700 rounded animate-pulse"></div>
            </div>
            <div className="h-10 bg-slate-800/60 rounded-xl p-2.5 flex items-center gap-2 border border-white/5">
              <div className="w-5 h-5 rounded-md bg-purple-500/30 animate-pulse"></div>
              <div className="h-3 w-20 bg-slate-700 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Booking Bar Skeleton */}
          <div className="pt-2 flex items-center justify-between border-t border-white/5">
            <div className="space-y-1">
              <div className="h-3 w-12 bg-slate-800 rounded animate-pulse"></div>
              <div className="h-6 w-20 bg-slate-700/80 rounded animate-pulse"></div>
            </div>
            <div className="h-10 w-28 rounded-xl bg-gradient-to-r from-blue-600/40 to-purple-600/40 animate-pulse"></div>
          </div>
        </div>

        {/* Animated Glowing Progress Line */}
        <div className="w-48 h-1 bg-slate-800 rounded-full mt-6 overflow-hidden relative">
          <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full w-full animate-[shimmer_1.5s_infinite]"></div>
        </div>
      </div>
    </div>
  );
}
