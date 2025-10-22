"use client";
import { useState } from "react";

export default function TicketModal({ booking, isOpen, onClose }) {
  const [showQR, setShowQR] = useState(true);

  if (!isOpen || !booking) return null;

  const generateQRCode = (ticketId) => {
    // Using a QR code API service - you can replace with your preferred service
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      ticketId
    )}`;
  };

  const handleDownload = () => {
    // Create a simple download functionality
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 400;
    canvas.height = 600;

    // Simple ticket design
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, 0, 400, 600);

    ctx.fillStyle = "#ffffff";
    ctx.font = "20px Arial";
    ctx.fillText("EventHub E-Ticket", 20, 40);

    ctx.font = "16px Arial";
    ctx.fillText(booking.event.title, 20, 80);
    ctx.fillText(`Ticket #${booking.id}`, 20, 110);

    // Download as image
    const link = document.createElement("a");
    link.download = `ticket-${booking.id}.png`;
    link.href = canvas.toDataURL();
    link.click();
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
              <button
                onClick={handleDownload}
                className="text-xs text-blue-300 hover:text-blue-200 flex items-center gap-1"
              >
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
              </button>
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
          <div className="border-b border-gray-200 pb-4">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
              Attendee Name
            </h4>
            <p className="text-gray-600">{booking.user?.name || "Attendee"}</p>
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
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800">QR Code</h4>
              <p className="text-xs text-gray-500">Scan at venue entrance</p>
            </div>

            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <img
                  src={generateQRCode(
                    `TKT-${booking.id
                      .slice(-8)
                      .toUpperCase()}-${booking.event.title
                      .replace(/\s+/g, "")
                      .substring(0, 8)
                      .toUpperCase()}`
                  )}
                  alt="QR Code for ticket verification"
                  className="w-40 h-40"
                />
              </div>
            </div>

            <div className="text-center mt-3">
              <p className="text-sm font-mono text-gray-600">
                TKT-{booking.id.slice(-8).toUpperCase()}-
                {booking.event.title
                  .replace(/\s+/g, "")
                  .substring(0, 8)
                  .toUpperCase()}
              </p>
            </div>
          </div>

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
