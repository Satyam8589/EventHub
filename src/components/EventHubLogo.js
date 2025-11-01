import React from "react";

export default function EventHubLogo({
  size = 32,
  showText = true,
  responsive = false, // New prop for responsive behavior
  className = "",
}) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Logo Icon */}
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Gradient Definitions */}
          <defs>
            <linearGradient
              id="logoGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                style={{ stopColor: "#3b82f6", stopOpacity: 1 }}
              />
              <stop
                offset="50%"
                style={{ stopColor: "#8b5cf6", stopOpacity: 1 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#ec4899", stopOpacity: 1 }}
              />
            </linearGradient>
            <linearGradient
              id="logoGradientGlow"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                style={{ stopColor: "#60a5fa", stopOpacity: 0.5 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#c084fc", stopOpacity: 0.5 }}
              />
            </linearGradient>
          </defs>

          {/* Outer Circle - Event Hub concept */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="url(#logoGradient)"
            opacity="0.1"
          />

          {/* Main E Shape with modern design */}
          <path
            d="M 30 25 L 70 25 L 70 35 L 40 35 L 40 45 L 65 45 L 65 55 L 40 55 L 40 65 L 70 65 L 70 75 L 30 75 Z"
            fill="url(#logoGradient)"
          />

          {/* Hub dots - representing connection/events */}
          <circle
            cx="75"
            cy="30"
            r="4"
            fill="url(#logoGradient)"
            opacity="0.8"
          />
          <circle
            cx="80"
            cy="45"
            r="3.5"
            fill="url(#logoGradient)"
            opacity="0.7"
          />
          <circle
            cx="75"
            cy="60"
            r="4"
            fill="url(#logoGradient)"
            opacity="0.8"
          />

          {/* Connection lines - subtle */}
          <line
            x1="70"
            y1="30"
            x2="75"
            y2="30"
            stroke="url(#logoGradient)"
            strokeWidth="1.5"
            opacity="0.4"
          />
          <line
            x1="65"
            y1="50"
            x2="80"
            y2="45"
            stroke="url(#logoGradient)"
            strokeWidth="1.5"
            opacity="0.4"
          />
          <line
            x1="70"
            y1="65"
            x2="75"
            y2="60"
            stroke="url(#logoGradient)"
            strokeWidth="1.5"
            opacity="0.4"
          />
        </svg>
      </div>

      {/* Text Logo */}
      {showText && (
        <span
          className={`font-bold bg-linear-to-r from-blue-500 via-purple-600 to-pink-500 bg-clip-text text-transparent whitespace-nowrap text-base sm:text-lg ${
            responsive ? "hidden sm:inline" : ""
          }`}
        >
          EventHub
        </span>
      )}
    </div>
  );
}

// Compact version for small spaces
export function EventHubLogoCompact({ size = 32, className = "" }) {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="compactGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              style={{ stopColor: "#3b82f6", stopOpacity: 1 }}
            />
            <stop
              offset="50%"
              style={{ stopColor: "#8b5cf6", stopOpacity: 1 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: "#ec4899", stopOpacity: 1 }}
            />
          </linearGradient>
        </defs>

        {/* Background Circle */}
        <circle cx="50" cy="50" r="48" fill="url(#compactGradient)" />

        {/* E Letter in white */}
        <path
          d="M 35 30 L 65 30 L 65 38 L 45 38 L 45 46 L 62 46 L 62 54 L 45 54 L 45 62 L 65 62 L 65 70 L 35 70 Z"
          fill="white"
        />
      </svg>
    </div>
  );
}
