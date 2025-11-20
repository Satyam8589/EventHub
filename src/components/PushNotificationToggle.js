"use client";
import { useState } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Bell, BellOff, BellRing } from "lucide-react";
import toast from "react-hot-toast";

export default function PushNotificationToggle() {
  const {
    isSupported,
    permission,
    isSubscribed,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribe();
        toast.success("Push notifications disabled");
      } else {
        await subscribe();
        toast.success("Push notifications enabled! 🔔");
      }
    } catch (error) {
      console.error("Error toggling push notifications:", error);
      toast.error(error.message || "Failed to toggle push notifications");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return null; // Don't show if not supported
  }

  if (permission === "denied") {
    return (
      <button
        disabled
        className="p-2 rounded-lg text-gray-400 cursor-not-allowed"
        title="Push notifications blocked - Please enable in browser settings"
      >
        <BellOff className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        relative p-2 rounded-lg transition-all duration-200
        ${isSubscribed
          ? "text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
          : "text-white/60 hover:text-white/80 hover:bg-white/10"
        }
        ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
      `}
      title={isSubscribed ? "Push notifications enabled - Click to disable" : "Enable push notifications"}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isSubscribed ? (
        <>
          <BellRing className="w-5 h-5" />
          {/* Active indicator dot */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
        </>
      ) : (
        <Bell className="w-5 h-5" />
      )}
    </button>
  );
}
