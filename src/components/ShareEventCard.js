"use client";

import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";

export default function ShareEventCard({ event, isOpen, onClose }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const cardRef = useRef(null);
  const wrapperRef = useRef(null);
  const captureWrapperRef = useRef(null);

  if (!isOpen) return null;

  // Debug: Log event data
  console.log("ShareEventCard - Event data:", {
    id: event?.id,
    name: event?.name,
    imageUrl: event?.imageUrl,
    hasImage: !!event?.imageUrl,
  });

  const eventUrl = `https://www.eventhubx.site/events/${event?.id || ''}`;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const dateValue =
      dateStr.includes("T") && dateStr.includes("Z")
        ? dateStr
        : dateStr.includes("T")
        ? dateStr + "Z"
        : dateStr.replace(" ", "T") + "Z";

    const date = new Date(dateValue);
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "Asia/Kolkata",
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    if (timeStr.includes("AM") || timeStr.includes("PM")) {
      return timeStr;
    }
    const timeParts = timeStr.split(":");
    if (timeParts.length === 2) {
      let hours = parseInt(timeParts[0]);
      const minutes = timeParts[1];
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${hours}:${minutes} ${ampm}`;
    }
    return timeStr;
  };

  const handleDownload = async () => {
    if (!cardRef.current || !wrapperRef.current || !captureWrapperRef.current) return;

    setIsDownloading(true);
    
    // Store original styles
    const originalWrapperWidth = wrapperRef.current.style.width;
    const originalWrapperMaxWidth = wrapperRef.current.style.maxWidth;
    const originalWrapperOpacity = wrapperRef.current.style.opacity;
    const originalWrapperPointerEvents = wrapperRef.current.style.pointerEvents;
    
    const originalCardWidth = cardRef.current.style.width;
    const originalCardMaxWidth = cardRef.current.style.maxWidth;
    const originalCardShadow = cardRef.current.style.boxShadow;
    const originalCardMargin = cardRef.current.style.margin;
    
    const originalCapturePadding = captureWrapperRef.current.style.padding;
    const originalCaptureBackground = captureWrapperRef.current.style.background;
    
    try {
      // Hide the card visually during capture to prevent visible changes
      wrapperRef.current.style.opacity = "0";
      wrapperRef.current.style.pointerEvents = "none";
      
      // Setup for capture - creating "breathing room" around the card
      // This decreases the relative size of the card in the final image
      captureWrapperRef.current.style.padding = "40px";
      captureWrapperRef.current.style.background = "transparent";
      
      // Force compact width for the card itself
      wrapperRef.current.style.width = "360px"; // Increased slightly from 280 to handle padding better
      wrapperRef.current.style.maxWidth = "360px";
      cardRef.current.style.width = "280px";
      cardRef.current.style.maxWidth = "280px";
      cardRef.current.style.margin = "0 auto"; // Center the card in the padded wrapper
      cardRef.current.style.boxShadow = "none";
      
      // Wait a bit for state-based re-render (isDownloading=true) and reflow
      await new Promise((resolve) => setTimeout(resolve, 600));

      const canvas = await html2canvas(captureWrapperRef.current, {
        backgroundColor: null, // Keeps background transparent
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        imageTimeout: 15000,
        removeContainer: true,
      });

      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.href = image;
      const filename = event?.name
        ? `${event.name
            .replace(/[^a-z0-9]/gi, "_")
            .toLowerCase()}_event_card.png`
        : "event_card.png";
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message
      alert("Event card downloaded successfully! ✅");
    } catch (error) {
      console.error("Error downloading card:", error);

      // Provide helpful fallback instructions
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const fallbackMsg = isMobile
        ? "Unable to auto-download. Please take a screenshot of this card to share."
        : "Unable to auto-download. Please take a screenshot (Windows: Win+Shift+S, Mac: Cmd+Shift+4) to save the card.";

      alert(`${fallbackMsg}\n\nError: ${error.message}`);
    } finally {
      // Always restore original styles for both elements
      if (wrapperRef.current) {
        wrapperRef.current.style.width = originalWrapperWidth;
        wrapperRef.current.style.maxWidth = originalWrapperMaxWidth;
        wrapperRef.current.style.opacity = originalWrapperOpacity;
        wrapperRef.current.style.pointerEvents = originalWrapperPointerEvents;
      }
      if (cardRef.current) {
        cardRef.current.style.width = originalCardWidth;
        cardRef.current.style.maxWidth = originalCardMaxWidth;
        cardRef.current.style.boxShadow = originalCardShadow;
        cardRef.current.style.margin = originalCardMargin;
      }
      if (captureWrapperRef.current) {
        captureWrapperRef.current.style.padding = originalCapturePadding;
        captureWrapperRef.current.style.background = originalCaptureBackground;
      }
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: event.name,
      text: `Check out ${event.name}! 🎉\n\n${event.description?.substring(
        0,
        100
      )}...`,
      url: eventUrl,
    };

    try {
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare(shareData)
      ) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(`${event.name}\n\n${eventUrl}`);
        alert("Event link copied to clipboard!");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error sharing:", error);
        // Fallback to clipboard
        try {
          await navigator.clipboard.writeText(`${event.name}\n\n${eventUrl}`);
          alert("Event link copied to clipboard!");
        } catch (clipError) {
          console.error("Clipboard error:", clipError);
        }
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        ref={wrapperRef}
        className="relative w-[92%] md:w-full mt-16 md:mt-0 max-h-none md:max-h-[95vh]"
        style={{ maxWidth: "500px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white text-2xl hover:text-red-400 transition-colors z-10"
        >
          ✕
        </button>

        {/* Capture Wrapper - Used to add padding around the card during download */}
        <div ref={captureWrapperRef}>
          {/* Shareable Card Container (the 4px broad gradient border) */}
          <div
            ref={cardRef}
            className="rounded-[32px] overflow-hidden shadow-2xl"
            style={{
              background: "linear-gradient(135deg, rgb(37, 99, 235) 0%, rgb(147, 51, 234) 50%, rgb(219, 39, 119) 100%)",
              width: "100%",
              maxWidth: "600px",
              padding: "4px", // 4px broad border
            }}
          >
          {/* Inner Content Card (dark background) */}
          <div
            style={{
              background: "rgb(15, 23, 42)",
              borderRadius: "28px",
              overflow: "hidden",
              width: "100%",
              height: "100%",
            }}
          >
          {/* Hero Section with Event Image */}
          <div
            className="relative overflow-hidden"
            style={{ height: "clamp(120px, 24vh, 160px)" }}
          >
            {event.imageUrl && !imageError ? (
              <img
                src={event.imageUrl}
                alt={event.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                crossOrigin="anonymous"
                onLoad={() => {
                  console.log("Image loaded successfully:", event.imageUrl);
                }}
                onError={(e) => {
                  console.log("Image failed to load:", event.imageUrl);
                  setImageError(true);
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background:
                    "linear-gradient(135deg, rgb(37, 99, 235) 0%, rgb(147, 51, 234) 50%, rgb(219, 39, 119) 100%)",
                }}
              ></div>
            )}

            {/* Gradient Overlay */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.3) 40%, rgba(15, 23, 42, 0.95) 100%)",
              }}
            ></div>

            {/* Event Title Overlay */}
            <div
              className="absolute bottom-0 left-0 right-0"
              style={{ padding: isDownloading ? "0.75rem 1rem" : "clamp(1rem, 3vw, 1.5rem)" }}
            >
              <h2
                style={{
                  color: "rgb(255, 255, 255)",
                  fontSize: isDownloading ? "1.1rem" : "clamp(1.25rem, 4vw, 2rem)",
                  fontWeight: "800",
                  lineHeight: "1.2",
                  marginBottom: isDownloading ? "0.35rem" : "0.5rem",
                  textShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
                }}
              >
                {event.name}
              </h2>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "rgb(203, 213, 225)",
                  fontSize: isDownloading ? "0.7rem" : "clamp(0.75rem, 2vw, 0.875rem)",
                  fontWeight: "500",
                  marginTop: isDownloading ? "0.5rem" : "0.75rem",
                }}
              >
                <span style={{ fontSize: "clamp(0.875rem, 2.5vw, 1rem)" }}>
                  🎤
                </span>
                <span>
                  Organized by{" "}
                  {event.organizerName || event.organizer?.name || "EventHubX"}
                </span>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div style={{ padding: isDownloading ? "0.75rem 1rem" : "clamp(0.875rem, 3vw, 1.5rem)" }}>
            {/* Event Details - Modern Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: isDownloading ? "0.4rem" : "clamp(0.5rem, 1.5vw, 0.75rem)",
                marginBottom: isDownloading ? "0.6rem" : "clamp(0.75rem, 2vw, 1rem)",
              }}
            >
              {/* Date Card */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)",
                  borderRadius: "0.875rem",
                  padding: isDownloading ? "0.35rem 0.5rem" : "clamp(0.75rem, 2.5vw, 1rem)",
                  border: "1px solid rgba(37, 99, 235, 0.2)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-20px",
                    right: "-20px",
                    fontSize: isDownloading ? "2rem" : "clamp(2.5rem, 8vw, 4rem)",
                    opacity: "0.1",
                  }}
                >
                  📅
                </div>
                <div
                  style={{
                    fontSize: isDownloading ? "0.6rem" : "clamp(0.65rem, 1.8vw, 0.75rem)",
                    color: "rgb(96, 165, 250)",
                    fontWeight: "600",
                    marginBottom: isDownloading ? "0.05rem" : "0.25rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Date
                </div>
                <div
                  style={{
                    color: "rgb(255, 255, 255)",
                    fontWeight: "700",
                    fontSize: isDownloading ? "0.75rem" : "clamp(0.8rem, 2.2vw, 0.95rem)",
                    lineHeight: "1.3",
                  }}
                >
                  {formatDate(event.date)}
                </div>
              </div>

              {/* Time Card */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(147, 51, 234, 0.05) 100%)",
                  borderRadius: "0.875rem",
                  padding: isDownloading ? "0.35rem 0.5rem" : "clamp(0.75rem, 2.5vw, 1rem)",
                  border: "1px solid rgba(147, 51, 234, 0.2)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-20px",
                    right: "-20px",
                    fontSize: isDownloading ? "2rem" : "clamp(2.5rem, 8vw, 4rem)",
                    opacity: "0.1",
                  }}
                >
                  🕐
                </div>
                <div
                  style={{
                    fontSize: isDownloading ? "0.6rem" : "clamp(0.65rem, 1.8vw, 0.75rem)",
                    color: "rgb(196, 181, 253)",
                    fontWeight: "600",
                    marginBottom: isDownloading ? "0.05rem" : "0.25rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Time
                </div>
                <div
                  style={{
                    color: "rgb(255, 255, 255)",
                    fontWeight: "700",
                    fontSize: isDownloading ? "0.75rem" : "clamp(0.8rem, 2.2vw, 0.95rem)",
                  }}
                >
                  {formatTime(event.time)}
                </div>
              </div>

              {/* Location Card - Full Width */}
              {event.location && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    background:
                      "linear-gradient(135deg, rgba(219, 39, 119, 0.1) 0%, rgba(219, 39, 119, 0.05) 100%)",
                    borderRadius: "0.875rem",
                    padding: isDownloading ? "0.35rem 0.5rem" : "clamp(0.75rem, 2.5vw, 1rem)",
                    border: "1px solid rgba(219, 39, 119, 0.2)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "-20px",
                      right: "-20px",
                      fontSize: isDownloading ? "2rem" : "clamp(2.5rem, 8vw, 4rem)",
                      opacity: "0.1",
                    }}
                  >
                    📍
                  </div>
                  <div
                    style={{
                      fontSize: isDownloading ? "0.6rem" : "clamp(0.65rem, 1.8vw, 0.75rem)",
                      color: "rgb(251, 113, 133)",
                      fontWeight: "600",
                      marginBottom: isDownloading ? "0.05rem" : "0.25rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Location
                  </div>
                  <div
                    style={{
                      color: "rgb(255, 255, 255)",
                      fontWeight: "700",
                      fontSize: isDownloading ? "0.75rem" : "clamp(0.8rem, 2.2vw, 0.95rem)",
                      lineHeight: "1.4",
                    }}
                  >
                    {event.location}
                  </div>
                </div>
              )}
            </div>

            {/* QR Code Section - Modern Design */}
            <div
              style={{
                background:
                  "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)",
                borderRadius: "1rem",
                padding: isDownloading ? "0.6rem 1rem" : "clamp(0.875rem, 3vw, 1.25rem)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: isDownloading ? "0.6rem" : "clamp(0.75rem, 2vw, 1rem)",
                marginBottom: isDownloading ? "0.6rem" : "clamp(0.75rem, 2vw, 1rem)",
              }}
            >
              {/* QR Code */}
              <div
                style={{
                  background: "rgb(255, 255, 255)",
                  padding: "clamp(0.5rem, 1.5vw, 0.75rem)",
                  borderRadius: "0.75rem",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                  flexShrink: 0,
                }}
              >
                <QRCodeSVG
                  value={eventUrl}
                  size={isDownloading ? 75 : Math.min(90, window.innerWidth * 0.18)}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>

              {/* QR Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3
                  style={{
                    fontSize: isDownloading ? "0.9rem" : "clamp(1rem, 3vw, 1.25rem)",
                    fontWeight: "800",
                    color: "rgb(255, 255, 255)",
                    marginBottom: isDownloading ? "0.25rem" : "0.5rem",
                  }}
                >
                  Scan to Book
                </h3>
                <p
                  style={{
                    fontSize: isDownloading ? "0.68rem" : "clamp(0.75rem, 2vw, 0.875rem)",
                    color: "rgb(203, 213, 225)",
                    lineHeight: "1.5",
                  }}
                >
                  Scan this QR code with your phone to view event details and
                  book tickets instantly
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "flex-start",
                paddingTop: isDownloading ? "0.4rem" : "clamp(0.75rem, 2vw, 1rem)",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                gap: isDownloading ? "0" : "0.25rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "clamp(0.5rem, 2vw, 0.75rem)",
                }}
              >
                <div
                  style={{
                    width: "clamp(2rem, 6vw, 2.5rem)",
                    height: "clamp(2rem, 6vw, 2.5rem)",
                    borderRadius: "0.75rem",
                    background:
                      "linear-gradient(135deg, rgb(37, 99, 235) 0%, rgb(147, 51, 234) 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
                  }}
                >
                  <span
                    style={{
                      color: "rgb(255, 255, 255)",
                      fontWeight: "800",
                      fontSize: "clamp(1rem, 3vw, 1.25rem)",
                    }}
                  >
                    E
                  </span>
                </div>
                <div>
                  <div
                    style={{
                      color: "rgb(255, 255, 255)",
                      fontWeight: "700",
                      fontSize: "clamp(0.8rem, 2.2vw, 0.95rem)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    EventHubX
                  </div>
                  <div
                    style={{
                      color: "rgb(148, 163, 184)",
                      fontSize: "clamp(0.65rem, 1.8vw, 0.75rem)",
                      fontWeight: "500",
                    }}
                  >
                    Your Event Platform
                  </div>
                </div>
              </div>

              <div
                style={{
                  color: "rgb(148, 163, 184)",
                  fontSize: isDownloading ? "12px" : "clamp(0.7rem, 1.8vw, 0.85rem)",
                  fontWeight: "600",
                  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
                  lineHeight: "1.3",
                  marginTop: isDownloading ? "0.4rem" : "0.6rem",
                  textAlign: "left",
                }}
              >
                <div style={{ marginBottom: "2px" }}>Explore Now:-</div>
                <div 
                  style={{ 
                    color: isDownloading ? "rgb(148, 163, 184)" : "rgb(96, 165, 250)",
                    fontSize: isDownloading ? "11px" : "clamp(0.6rem, 1.6vw, 0.75rem)",
                    letterSpacing: "0px",
                    wordSpacing: "0px",
                    wordBreak: "break-all"
                  }}
                >
                  {eventUrl}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-row gap-3">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            style={{
              background:
                "linear-gradient(90deg, rgb(37, 99, 235) 0%, rgb(147, 51, 234) 100%)",
            }}
            className="flex-1 text-white py-2 px-4 rounded-2xl font-bold text-sm hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span className="text-lg">📥</span>
            {isDownloading ? "Downloading..." : "Download Card"}
          </button>

          <button
            onClick={handleShare}
            style={{
              background:
                "linear-gradient(90deg, rgb(22, 163, 74) 0%, rgb(20, 184, 166) 100%)",
            }}
            className="flex-1 text-white py-2 px-4 rounded-2xl font-bold text-sm hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <span className="text-xl">📤</span>
            Share Event
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center">
          <p className="text-gray-400 text-sm">
            Download the card or share directly to social media, WhatsApp, or
            anywhere!
          </p>
        </div>
      </div>
    </div>
  );
}
