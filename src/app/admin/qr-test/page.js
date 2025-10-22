"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/AdminLayout";

export default function QRTestPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [creating, setCreating] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role === "SUPER_ADMIN") {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/admin/events");
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
        if (data.events && data.events.length > 0) {
          setSelectedEvent(data.events[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const createTestBookings = async () => {
    if (!selectedEvent || !user) return;

    try {
      setCreating(true);
      const response = await fetch("/api/admin/create-test-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEvent,
          userId: user.uid,
        }),
      });

      if (response.ok) {
        alert("Test bookings created successfully!");
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating test bookings:", error);
      alert("Failed to create test bookings");
    } finally {
      setCreating(false);
    }
  };

  const generateQRCode = async (bookingId) => {
    try {
      // Import QRCode library dynamically (client-side only)
      const QRCode = (await import("qrcode")).default;

      // Create canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Generate QR code
      await QRCode.toCanvas(canvas, bookingId, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      // Add padding and text
      const finalCanvas = document.createElement("canvas");
      const finalCtx = finalCanvas.getContext("2d");

      finalCanvas.width = 350;
      finalCanvas.height = 380;

      // White background
      finalCtx.fillStyle = "#ffffff";
      finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      // Draw QR code
      finalCtx.drawImage(canvas, 25, 25);

      // Add text
      finalCtx.fillStyle = "#000000";
      finalCtx.font = "16px Arial";
      finalCtx.textAlign = "center";
      finalCtx.fillText("EventHub Ticket", finalCanvas.width / 2, 350);
      finalCtx.font = "14px Arial";
      finalCtx.fillText(`Booking ID: ${bookingId}`, finalCanvas.width / 2, 370);

      // Download
      const link = document.createElement("a");
      link.download = `ticket-${bookingId}.png`;
      link.href = finalCanvas.toDataURL();
      link.click();
    } catch (error) {
      console.error("Error generating QR code:", error);
      alert("Failed to generate QR code");
    }
  };

  if (!user || user.role !== "SUPER_ADMIN") {
    return (
      <AdminLayout activeTab="settings">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-gray-300">
            Only super admins can access this page.
          </p>
        </div>
      </AdminLayout>
    );
  }

  const testBookingIds = [
    "booking_test_001",
    "booking_test_002",
    "booking_test_003",
    "invalid_booking_id",
  ];

  return (
    <AdminLayout activeTab="settings">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">QR Code Test</h1>
          <p className="text-gray-300 mt-1">
            Generate QR codes for testing ticket scanning
          </p>
        </div>

        {/* Event Selection */}
        {events.length > 0 && (
          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Select Event
            </h2>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <select
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500"
                >
                  {events.map((event) => (
                    <option
                      key={event.id}
                      value={event.id}
                      className="bg-slate-900"
                    >
                      {event.title} -{" "}
                      {new Date(event.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={createTestBookings}
                disabled={creating || !selectedEvent}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Test Bookings"}
              </button>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              This will create test bookings for the selected event that you can
              scan with QR codes.
            </p>
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Test Booking IDs
          </h2>
          <p className="text-gray-300 mb-4">
            Use these booking IDs to test the QR scanner functionality:
          </p>

          <div className="grid gap-3">
            {testBookingIds.map((bookingId, index) => (
              <div
                key={bookingId}
                className="flex items-center justify-between p-4 bg-white/10 rounded-lg"
              >
                <div>
                  <div className="font-mono text-white">{bookingId}</div>
                  <div className="text-sm text-gray-400">
                    {index < 3
                      ? "Valid test booking"
                      : "Invalid booking (for testing errors)"}
                  </div>
                </div>
                <button
                  onClick={() => generateQRCode(bookingId)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Generate QR
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Instructions
          </h2>
          <ul className="space-y-2 text-gray-300">
            <li>1. Generate QR codes for test booking IDs above</li>
            <li>2. Go to the Scanner page as an event admin</li>
            <li>
              3. Manually enter the booking ID or scan the generated QR code
            </li>
            <li>4. Test both valid and invalid booking IDs</li>
            <li>5. Verify the scanning statistics update correctly</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
