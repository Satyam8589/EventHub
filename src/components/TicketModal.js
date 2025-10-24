"use client";
import { useState } from "react";

export default function TicketModal({ booking, isOpen, onClose }) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !booking) return null;

  const generateQRCode = (ticketId) => {
    // Using a QR code API service - you can replace with your preferred service
    // Add timestamp to prevent caching issues
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      ticketId
    )}&t=${Date.now()}`;
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Create a high-quality ticket canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Set canvas size for high quality (modern aspect ratio)
      canvas.width = 900;
      canvas.height = 1400;

      // Modern gradient background
      const bgGradient = ctx.createLinearGradient(0, 0, 900, 1400);
      bgGradient.addColorStop(0, "#0f172a"); // slate-950
      bgGradient.addColorStop(0.5, "#1e293b"); // slate-800
      bgGradient.addColorStop(1, "#334155"); // slate-700
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, 900, 1400);

      // Load and draw event image at the top
      let yPosition = 0;
      if (booking.event.imageUrl) {
        const eventImage = new Image();
        eventImage.crossOrigin = "anonymous";
        eventImage.src = booking.event.imageUrl;

        await new Promise((resolve) => {
          eventImage.onload = () => {
            // Draw event image with overlay
            ctx.save();
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, 900, 250);

            // Calculate image dimensions to cover area while maintaining aspect ratio
            const targetWidth = 900;
            const targetHeight = 250;
            const imgRatio = eventImage.width / eventImage.height;
            const targetRatio = targetWidth / targetHeight;

            let drawWidth, drawHeight, offsetX, offsetY;
            if (imgRatio > targetRatio) {
              drawHeight = targetHeight;
              drawWidth = eventImage.width * (targetHeight / eventImage.height);
              offsetX = (targetWidth - drawWidth) / 2;
              offsetY = 0;
            } else {
              drawWidth = targetWidth;
              drawHeight = eventImage.height * (targetWidth / eventImage.width);
              offsetX = 0;
              offsetY = (targetHeight - drawHeight) / 2;
            }

            ctx.drawImage(eventImage, offsetX, offsetY, drawWidth, drawHeight);

            // Add gradient overlay for better text visibility
            const overlayGradient = ctx.createLinearGradient(0, 0, 0, 250);
            overlayGradient.addColorStop(0, "rgba(0, 0, 0, 0.3)");
            overlayGradient.addColorStop(1, "rgba(0, 0, 0, 0.8)");
            ctx.fillStyle = overlayGradient;
            ctx.fillRect(0, 0, 900, 250);

            ctx.restore();
            resolve();
          };
          eventImage.onerror = () => {
            // If image fails to load, just fill with gradient
            const fallbackGradient = ctx.createLinearGradient(0, 0, 0, 250);
            fallbackGradient.addColorStop(0, "#1e293b");
            fallbackGradient.addColorStop(1, "#0f172a");
            ctx.fillStyle = fallbackGradient;
            ctx.fillRect(0, 0, 900, 250);
            resolve();
          };
        });
        yPosition = 250;
      } else {
        // Fallback gradient header if no image
        const headerGradient = ctx.createLinearGradient(0, 0, 0, 250);
        headerGradient.addColorStop(0, "#1e293b");
        headerGradient.addColorStop(1, "#0f172a");
        ctx.fillStyle = headerGradient;
        ctx.fillRect(0, 0, 900, 250);
        yPosition = 250;
      }

      // Decorative top accent with dual colors
      const topGradient = ctx.createLinearGradient(0, 0, 900, 0);
      topGradient.addColorStop(0, "#3b82f6"); // blue-600
      topGradient.addColorStop(0.5, "#6366f1"); // indigo-500
      topGradient.addColorStop(1, "#8b5cf6"); // violet-500
      ctx.fillStyle = topGradient;
      ctx.fillRect(0, 0, 900, 8);

      // Modern card effect overlay on image area
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.fillRect(40, 40, 820, 170);

      // Subtle border for card
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1;
      ctx.strokeRect(40, 40, 820, 170);

      // EventHub Logo with modern styling
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 48px Arial";
      ctx.fillText("EventHub", 60, 100);

      // Stylish badge for E-Ticket
      ctx.fillStyle = "rgba(59, 130, 246, 0.3)";
      ctx.fillRect(60, 125, 120, 35);
      ctx.fillStyle = "#60a5fa";
      ctx.font = "bold 16px Arial";
      ctx.fillText("E-TICKET", 75, 148);

      // Add decorative corner accent
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.moveTo(820, 40);
      ctx.lineTo(860, 40);
      ctx.lineTo(860, 80);
      ctx.closePath();
      ctx.fill();

      // Ticket ID in modern style
      yPosition = yPosition + 20;
      ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
      ctx.fillRect(60, yPosition, 780, 50);

      ctx.fillStyle = "#60a5fa";
      ctx.font = "bold 14px Arial";
      ctx.fillText("TICKET ID", 80, yPosition + 20);

      ctx.fillStyle = "#ffffff";
      ctx.font = "16px monospace";
      ctx.fillText(booking.id.slice(-12).toUpperCase(), 80, yPosition + 40);

      // Stylish separator
      yPosition += 80;
      const separatorGradient = ctx.createLinearGradient(
        60,
        yPosition,
        840,
        yPosition
      );
      separatorGradient.addColorStop(0, "rgba(59, 130, 246, 0)");
      separatorGradient.addColorStop(0.5, "rgba(59, 130, 246, 0.5)");
      separatorGradient.addColorStop(1, "rgba(59, 130, 246, 0)");
      ctx.fillStyle = separatorGradient;
      ctx.fillRect(60, yPosition, 780, 2);

      // Event Title Section with modern styling
      yPosition += 50;
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 38px Arial";
      const eventTitle = booking.event.title;
      // Wrap text if too long
      const maxWidth = 780;
      if (ctx.measureText(eventTitle).width > maxWidth) {
        const words = eventTitle.split(" ");
        let line = "";
        for (let word of words) {
          const testLine = line + word + " ";
          if (ctx.measureText(testLine).width > maxWidth) {
            ctx.fillText(line, 60, yPosition);
            line = word + " ";
            yPosition += 45;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, 60, yPosition);
      } else {
        ctx.fillText(eventTitle, 60, yPosition);
      }

      // Modern info cards section
      yPosition += 70;

      // Date & Time Card
      ctx.fillStyle = "rgba(99, 102, 241, 0.1)"; // indigo tint
      ctx.fillRect(60, yPosition, 370, 120);
      ctx.strokeStyle = "rgba(99, 102, 241, 0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(60, yPosition, 370, 120);

      ctx.fillStyle = "#818cf8"; // indigo-400
      ctx.font = "bold 16px Arial";
      ctx.fillText("📅 DATE & TIME", 80, yPosition + 30);

      ctx.fillStyle = "#f1f5f9"; // slate-100
      ctx.font = "16px Arial";
      const eventDate = new Date(booking.event.date).toLocaleDateString(
        "en-US",
        {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        }
      );
      ctx.fillText(eventDate, 80, yPosition + 60);
      if (booking.event.time) {
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "15px Arial";
        ctx.fillText(`⏰ ${booking.event.time}`, 80, yPosition + 85);
      }

      // Location Card
      ctx.fillStyle = "rgba(139, 92, 246, 0.1)"; // violet tint
      ctx.fillRect(470, yPosition, 370, 120);
      ctx.strokeStyle = "rgba(139, 92, 246, 0.3)";
      ctx.strokeRect(470, yPosition, 370, 120);

      ctx.fillStyle = "#a78bfa"; // violet-400
      ctx.font = "bold 16px Arial";
      ctx.fillText("📍 LOCATION", 490, yPosition + 30);

      ctx.fillStyle = "#f1f5f9";
      ctx.font = "15px Arial";
      const location = booking.event.location || "Venue TBA";
      // Wrap location if too long
      if (ctx.measureText(location).width > 330) {
        const words = location.split(" ");
        let line = "";
        let lineY = yPosition + 60;
        for (let word of words) {
          const testLine = line + word + " ";
          if (ctx.measureText(testLine).width > 330) {
            ctx.fillText(line, 490, lineY);
            line = word + " ";
            lineY += 25;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, 490, lineY);
      } else {
        ctx.fillText(location, 490, yPosition + 60);
      }

      yPosition += 150;

      // Organizer Information Card
      ctx.fillStyle = "rgba(139, 92, 246, 0.1)"; // violet tint
      ctx.fillRect(60, yPosition, 780, 80);
      ctx.strokeStyle = "rgba(139, 92, 246, 0.3)";
      ctx.strokeRect(60, yPosition, 780, 80);

      ctx.fillStyle = "#a78bfa"; // violet-400
      ctx.font = "bold 16px Arial";
      ctx.fillText("🎭 ORGANIZED BY", 80, yPosition + 30);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px Arial";
      const organizerName = booking.event.organizerName || "Event Organizer";
      ctx.fillText(organizerName, 80, yPosition + 60);

      yPosition += 110;

      // Attendee Information Card
      ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
      ctx.fillRect(60, yPosition, 370, 140);
      ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
      ctx.strokeRect(60, yPosition, 370, 140);

      ctx.fillStyle = "#60a5fa";
      ctx.font = "bold 16px Arial";
      ctx.fillText("👤 ATTENDEE", 80, yPosition + 30);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px Arial";
      ctx.fillText(booking.user?.name || "Guest", 80, yPosition + 65);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px Arial";
      ctx.fillText(
        "📧 " + (booking.user?.email || "No email"),
        80,
        yPosition + 95
      );

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "13px Arial";
      ctx.fillText(
        `ID: ${booking.user?.id?.slice(-8) || "N/A"}`,
        80,
        yPosition + 120
      );

      // Tickets & Status Card
      ctx.fillStyle = "rgba(16, 185, 129, 0.1)"; // green tint
      ctx.fillRect(470, yPosition, 370, 140);
      ctx.strokeStyle = "rgba(16, 185, 129, 0.3)";
      ctx.strokeRect(470, yPosition, 370, 140);

      ctx.fillStyle = "#34d399"; // green-400
      ctx.font = "bold 16px Arial";
      ctx.fillText("🎫 TICKET DETAILS", 490, yPosition + 30);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px Arial";
      ctx.fillText(`${booking.tickets}`, 490, yPosition + 70);
      ctx.font = "16px Arial";
      ctx.fillText("Ticket(s)", 540, yPosition + 70);

      // Status Badge
      ctx.fillStyle = "#10b981"; // green-500
      ctx.fillRect(490, yPosition + 95, 140, 32);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px Arial";
      ctx.fillText("✓ CONFIRMED", 510, yPosition + 117);

      yPosition += 170;

      // QR Code Section - Modern centered design
      yPosition += 30;

      // Stylish separator
      const qrSeparatorGradient = ctx.createLinearGradient(
        60,
        yPosition,
        840,
        yPosition
      );
      qrSeparatorGradient.addColorStop(0, "rgba(139, 92, 246, 0)");
      qrSeparatorGradient.addColorStop(0.5, "rgba(139, 92, 246, 0.5)");
      qrSeparatorGradient.addColorStop(1, "rgba(139, 92, 246, 0)");
      ctx.fillStyle = qrSeparatorGradient;
      ctx.fillRect(60, yPosition, 780, 2);

      yPosition += 50;

      // QR Section Title
      ctx.fillStyle = "#a78bfa"; // violet-400
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.fillText("SCAN FOR ENTRY", 450, yPosition);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px Arial";
      ctx.fillText(
        "Present this QR code at the venue entrance",
        450,
        yPosition + 25
      );
      ctx.textAlign = "left";

      // Load QR Code image
      const qrImage = new Image();
      qrImage.crossOrigin = "anonymous";
      qrImage.src = generateQRCode(booking.id);

      await new Promise((resolve, reject) => {
        qrImage.onload = () => {
          yPosition += 60;

          // Modern QR container with glow effect
          ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
          ctx.fillRect(300, yPosition, 300, 300);

          // Border with gradient
          const qrBorderGradient = ctx.createLinearGradient(
            300,
            yPosition,
            600,
            yPosition + 300
          );
          qrBorderGradient.addColorStop(0, "#3b82f6");
          qrBorderGradient.addColorStop(0.5, "#8b5cf6");
          qrBorderGradient.addColorStop(1, "#3b82f6");
          ctx.strokeStyle = qrBorderGradient;
          ctx.lineWidth = 3;
          ctx.strokeRect(300, yPosition, 300, 300);

          // White background for QR
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(320, yPosition + 20, 260, 260);

          // Draw QR code
          ctx.drawImage(qrImage, 320, yPosition + 20, 260, 260);

          // QR Code ID below
          ctx.fillStyle = "#64748b";
          ctx.font = "12px monospace";
          ctx.textAlign = "center";
          ctx.fillText(booking.id, 450, yPosition + 330);
          ctx.textAlign = "left";

          resolve();
        };
        qrImage.onerror = reject;
      });

      // Footer Instructions with modern card design
      yPosition += 390;

      // Instructions card
      const instructionsGradient = ctx.createLinearGradient(
        60,
        yPosition,
        840,
        yPosition + 140
      );
      instructionsGradient.addColorStop(0, "rgba(30, 64, 175, 0.8)");
      instructionsGradient.addColorStop(1, "rgba(99, 102, 241, 0.8)");
      ctx.fillStyle = instructionsGradient;
      ctx.fillRect(60, yPosition, 780, 140);

      // Border for instructions
      ctx.strokeStyle = "rgba(147, 197, 253, 0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(60, yPosition, 780, 140);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px Arial";
      ctx.fillText("⚠️ IMPORTANT INSTRUCTIONS", 90, yPosition + 35);

      ctx.font = "15px Arial";
      ctx.fillStyle = "#dbeafe";
      ctx.fillText(
        "✓ Present this ticket (digital or printed) at venue entrance",
        90,
        yPosition + 65
      );
      ctx.fillText(
        "✓ QR code will be scanned for verification",
        90,
        yPosition + 90
      );
      ctx.fillText(
        "✓ Each ticket can only be scanned once - No re-entry",
        90,
        yPosition + 115
      );

      // Modern footer
      yPosition += 170;
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.fillRect(60, yPosition, 780, 1);

      yPosition += 30;
      ctx.fillStyle = "#64748b";
      ctx.font = "13px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        "Powered by EventHub • AI-Generated E-Ticket",
        450,
        yPosition
      );

      ctx.fillStyle = "#475569";
      ctx.font = "11px Arial";
      ctx.fillText(
        `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
        450,
        yPosition + 20
      );
      ctx.textAlign = "left";

      // Download as image
      const link = document.createElement("a");
      link.download = `EventHub-Ticket-${booking.id
        .slice(-8)
        .toUpperCase()}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
    } catch (error) {
      console.error("Error generating ticket:", error);
      alert("Failed to generate ticket. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto relative overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-20 bg-white/10 hover:bg-white/20 rounded-full p-1"
          >
            <svg
              className="w-5 h-5"
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

          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold">EventHub E-Ticket</h2>
              {/* Hide download button if ticket is verified */}
              {!(booking.paymentId && booking.paymentId.startsWith("SCANNED_")) ? (
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="text-xs text-blue-300 hover:text-blue-200 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloading ? (
                    <>
                      <svg
                        className="w-3 h-3 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Download
                    </>
                  )}
                </button>
              ) : (
                <span className="text-xs text-green-300">✓ Ticket Verified</span>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-1">
              {booking.event.title}
            </h3>
            <p className="text-sm text-slate-300">
              Ticket #{booking.id.slice(-8).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Ticket Details */}
        <div className="p-6 space-y-4">
          {/* Attendee Info */}
          <div className="border-b border-gray-200 pb-4 space-y-3">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
                Attendee Details
              </h4>
              <div className="space-y-2">
                <p className="text-gray-800 font-medium">
                  {booking.user?.name || "Attendee"}
                </p>
                {booking.user?.email && (
                  <p className="text-gray-600 text-sm flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    {booking.user.email}
                  </p>
                )}
                {booking.user?.phone && (
                  <p className="text-gray-600 text-sm flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    {booking.user.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <h4 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
                Date & Time
              </h4>
              <p className="text-gray-600 text-sm">
                {new Date(booking.event.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                {booking.event.time && ` at ${booking.event.time}`}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                Location
              </h4>
              <p className="text-gray-600 text-sm">{booking.event.location}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Number of Tickets
              </h4>
              <p className="text-gray-600 text-sm">{booking.tickets}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Ticket Status
              </h4>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 font-medium">
                  Confirmed
                </span>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="border-t border-gray-200 pt-4">
            {booking.paymentId && booking.paymentId.startsWith("SCANNED_") ? (
              /* Ticket Already Verified */
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-green-600 mb-2">
                  Thank You for Visiting! ✓
                </h3>
                <p className="text-lg text-gray-700 mb-3">Enjoy the Event!</p>
                <p className="text-gray-600 mb-4">
                  Your ticket has been successfully verified
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mx-4">
                  <p className="text-sm text-green-800 mb-2">
                    <strong>Verified At:</strong>{" "}
                    {new Date(
                      booking.paymentId.replace("SCANNED_", "")
                    ).toLocaleString()}
                  </p>
                  <p className="text-sm text-green-700">
                    <strong>Attendee:</strong> {booking.user?.name || "N/A"}
                  </p>
                  <p className="text-sm text-green-700">
                    <strong>Email:</strong> {booking.user?.email || "N/A"}
                  </p>
                  <p className="text-sm text-green-700">
                    <strong>Phone:</strong> {booking.user?.phone || "N/A"}
                  </p>
                  <p className="text-sm text-green-700">
                    <strong>Tickets:</strong> {booking.tickets || 1}
                  </p>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  This ticket has been used and cannot be scanned again.
                </div>
              </div>
            ) : (
              /* Show QR Code for Unverified Tickets */
              <>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800">QR Code</h4>
                  <p className="text-xs text-gray-500">
                    Scan at venue entrance
                  </p>
                </div>

                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                    <img
                      src={generateQRCode(booking.id)}
                      alt="QR Code for ticket verification"
                      className="w-40 h-40"
                    />
                  </div>
                </div>

                <div className="text-center mt-3">
                  <p className="text-sm font-mono text-gray-600">
                    {booking.id}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Download Ticket Button - Hide if verified */}
          {!(booking.paymentId && booking.paymentId.startsWith("SCANNED_")) ? (
            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isDownloading ? (
                  <>
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Generating Your Ticket...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Download Full Ticket
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="border-t border-gray-200 pt-4">
              <div className="w-full bg-green-100 border border-green-300 text-green-800 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Ticket Already Verified
              </div>
            </div>
          )}

          {/* Important Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Important:</strong> Please bring this ticket (digital or
              printed) to the event. Entry will be granted upon QR code
              verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
