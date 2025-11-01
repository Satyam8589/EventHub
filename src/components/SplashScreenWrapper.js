"use client";

import dynamic from "next/dynamic";

// Dynamically import SplashScreen with no SSR to prevent hydration issues
const SplashScreenComponent = dynamic(() => import("./SplashScreenSimple"), {
  ssr: false,
  loading: () => null,
});

export default function SplashScreenWrapper() {
  return <SplashScreenComponent />;
}
