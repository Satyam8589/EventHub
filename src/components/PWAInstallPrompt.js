"use client";
import { useState, useEffect } from "react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const checkStandalone = () => {
      return (
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator?.standalone ||
        document.referrer.includes("android-app://")
      );
    };

    setIsStandalone(checkStandalone());

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Show install prompt if not already installed and user hasn't installed
      if (!checkStandalone()) {
        // Check if user has permanently dismissed or recently dismissed
        const hasUserDismissedPermanently = localStorage.getItem(
          "pwa-install-dismissed-permanently"
        );
        const lastDismissed = localStorage.getItem(
          "pwa-install-last-dismissed"
        );
        const oneDayInMs = 24 * 60 * 60 * 1000;

        if (!hasUserDismissedPermanently) {
          if (
            !lastDismissed ||
            Date.now() - parseInt(lastDismissed) > oneDayInMs
          ) {
            setShowInstallPrompt(true);
          }
        }
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem("pwa-install-dismissed-permanently");
      localStorage.removeItem("pwa-install-last-dismissed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Show prompt on every visit if not installed (key requirement)
    if (!checkStandalone()) {
      const hasUserDismissedPermanently = localStorage.getItem(
        "pwa-install-dismissed-permanently"
      );
      if (!hasUserDismissedPermanently) {
        // Show after a short delay to not interfere with page load
        const timer = setTimeout(() => {
          setShowInstallPrompt(true);
        }, 3000);

        return () => {
          clearTimeout(timer);
          window.removeEventListener(
            "beforeinstallprompt",
            handleBeforeInstallPrompt
          );
          window.removeEventListener("appinstalled", handleAppInstalled);
        };
      }
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback for browsers that don't support beforeinstallprompt
      setShowInstallPrompt(false);
      return;
    }

    const result = await deferredPrompt.prompt();
    console.log("Install prompt result:", result);

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem("pwa-install-last-dismissed", Date.now().toString());
  };

  const handleDismissPermanently = () => {
    setShowInstallPrompt(false);
    localStorage.setItem("pwa-install-dismissed-permanently", "true");
  };

  // Don't show if already installed
  if (isStandalone || !showInstallPrompt) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {/* Install Prompt Modal */}
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 2a1 1 0 00-1 1v2a1 1 0 102 0v-2a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Install EventHub</h2>
                <p className="text-white/80 text-sm">
                  Get the full app experience
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4">
              <p className="text-gray-600 leading-relaxed">
                Install EventHub on your device for a better experience with:
              </p>

              <ul className="space-y-2">
                <li className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">
                    Faster loading and offline access
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">
                    Push notifications for new events
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">
                    Home screen access
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">
                    Native app-like experience
                  </span>
                </li>
              </ul>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Install App
              </button>
              <div className="flex gap-2 sm:flex-col lg:flex-row">
                <button
                  onClick={handleDismiss}
                  className="flex-1 text-gray-500 hover:text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors text-sm"
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleDismissPermanently}
                  className="flex-1 text-gray-400 hover:text-gray-600 py-3 px-4 rounded-xl font-medium transition-colors text-sm"
                >
                  Don't Ask Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
