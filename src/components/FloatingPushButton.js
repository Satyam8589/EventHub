"use client";
import { useState } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Bell, BellOff, BellRing, X } from "lucide-react";
import toast from "react-hot-toast";

export default function FloatingPushButton() {
  const {
    isSupported,
    permission,
    isSubscribed,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribe();
        toast.success("Push notifications disabled");
      } else {
        await subscribe();
        toast.success("Push notifications enabled! 🔔");
        setShowTooltip(false);
      }
    } catch (error) {
      console.error("Error toggling push notifications:", error);
      toast.error(error.message || "Failed to toggle push notifications");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported || permission === "denied") {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-20 right-4 z-40 md:hidden">
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={`
            relative group
            w-14 h-14 rounded-full shadow-2xl
            flex items-center justify-center
            transition-all duration-300 transform
            ${isSubscribed
              ? "bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              : "bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700"
            }
            ${isLoading ? "opacity-50 cursor-not-allowed scale-95" : "hover:scale-110 active:scale-95"}
            border-2 border-white/20
          `}
          aria-label={isSubscribed ? "Disable push notifications" : "Enable push notifications"}
        >
          {isLoading ? (
            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
          ) : isSubscribed ? (
            <BellRing className="w-6 h-6 text-white animate-pulse" />
          ) : (
            <Bell className="w-6 h-6 text-white" />
          )}

          {/* Pulse animation when not subscribed */}
          {!isSubscribed && !isLoading && (
            <>
              <span className="absolute inset-0 rounded-full bg-gray-600 animate-ping opacity-75"></span>
              <span className="absolute inset-0 rounded-full bg-gray-600 animate-pulse opacity-50"></span>
            </>
          )}
        </button>

        {/* Tooltip */}
        {showTooltip && !isSubscribed && !isLoading && (
          <div className="absolute bottom-full right-0 mb-2 w-48 animate-bounce">
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs rounded-lg px-3 py-2 shadow-xl">
              <button
                onClick={() => setShowTooltip(false)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-white text-gray-800 rounded-full flex items-center justify-center hover:bg-gray-100"
              >
                <X className="w-3 h-3" />
              </button>
              <p className="font-semibold mb-1">🔔 Enable Notifications!</p>
              <p className="text-white/90">Get instant alerts for new events</p>
              <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-purple-600"></div>
            </div>
          </div>
        )}
      </div>

      {/* Status Badge (when subscribed) */}
      {isSubscribed && (
        <div className="fixed bottom-36 right-4 z-30 md:hidden">
          <div className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-fade-in">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            Active
          </div>
        </div>
      )}
    </>
  );
}
