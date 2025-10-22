"use client";
import { useEffect, useState } from "react";

export default function VerificationSuccessPopup({
  isVisible,
  onClose,
  bookingData,
  autoCloseDelay = 5000,
}) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isVisible) {
      setProgress(100);
      return;
    }

    // Auto-close timer with progress bar
    const timer = setTimeout(() => {
      onClose();
    }, autoCloseDelay);

    // Progress bar animation
    const startTime = Date.now();
    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / autoCloseDelay) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(progressTimer);
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      clearInterval(progressTimer);
    };
  }, [isVisible, autoCloseDelay, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-green-900 to-emerald-900 rounded-2xl border border-green-500/30 p-8 max-w-md w-full mx-4 relative overflow-hidden">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 h-1 bg-green-500/30 w-full">
          <div
            className="h-full bg-green-400 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-green-300 hover:text-white transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="text-center">
          {/* Success animation */}
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
              <svg
                className="w-12 h-12 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping"></div>
          </div>

          {/* Success message */}
          <h2 className="text-2xl font-bold text-green-400 mb-2">
            🎉 Ticket Verified!
          </h2>
          <p className="text-green-200 mb-6">
            Welcome to the event! Entry approved.
          </p>

          {/* Booking details */}
          {bookingData && (
            <div className="bg-black/30 rounded-lg p-4 mb-6 text-left">
              <h3 className="text-green-300 font-semibold mb-3">
                Booking Details:
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-200">Attendee:</span>
                  <span className="text-white font-medium">
                    {bookingData.userName}
                  </span>
                </div>
                {bookingData.userEmail && (
                  <div className="flex justify-between">
                    <span className="text-green-200">Email:</span>
                    <span className="text-white">{bookingData.userEmail}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-green-200">Event:</span>
                  <span className="text-white font-medium">
                    {bookingData.eventTitle}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-200">Tickets:</span>
                  <span className="text-white">{bookingData.tickets}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-200">Verified At:</span>
                  <span className="text-white">
                    {new Date(bookingData.verifiedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Thank you message */}
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-4 border border-green-400/30">
            <h4 className="text-lg font-semibold text-green-300 mb-2">
              Thank You for Visiting! 🌟
            </h4>
            <p className="text-green-200 text-sm">
              Enjoy the event and have a wonderful experience!
            </p>
          </div>

          {/* Auto-close notice */}
          <p className="text-xs text-green-300/70 mt-4">
            This popup will close automatically in {Math.ceil(progress / 20)}{" "}
            seconds
          </p>
        </div>
      </div>
    </div>
  );
}
