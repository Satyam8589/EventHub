"use client";
import { useState, useEffect } from "react";

/**
 * Hook to prevent hydration mismatches between server and client rendering
 * Returns true only after the component has mounted on the client
 */
export function useHydration() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
