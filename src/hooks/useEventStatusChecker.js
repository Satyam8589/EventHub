"use client";
import { useEffect } from "react";

/**
 * Hook to periodically check for events that should be marked as ONGOING
 * This runs on the client side and calls the cron endpoint
 */
export const useEventStatusChecker = (intervalMinutes = 5) => {
  useEffect(() => {
    // Function to check event statuses
    const checkEventStatuses = async () => {
      try {
        const response = await fetch("/api/cron/check-ongoing-events");
        if (response.ok) {
          const data = await response.json();
          console.log("Event status check:", data.message);
        }
      } catch (error) {
        console.error("Failed to check event statuses:", error);
      }
    };

    // Check immediately on mount
    checkEventStatuses();

    // Set up interval to check periodically
    const intervalMs = intervalMinutes * 60 * 1000;
    const interval = setInterval(checkEventStatuses, intervalMs);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [intervalMinutes]);
};
