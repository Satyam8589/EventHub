"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";

export default function TicketScanner() {
  const [ticketCode, setTicketCode] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Check admin access
  useEffect(() => {
    if (
      !authLoading &&
      (!user || (user.role !== "SUPER_ADMIN" && user.role !== "EVENT_ADMIN"))
    ) {
      router.push("/");
      return;
    }
  }, [user, authLoading, router]);

  // Fetch events user can manage
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;

      try {
        const endpoint =
          user.role === "SUPER_ADMIN"
            ? "/api/admin/events"
            : `/api/admin/events?adminUserId=${user.uid}`;

        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          setEvents(data.events || []);

          // Auto-select first event if only one available
          if (data.events && data.events.length === 1) {
            setSelectedEvent(data.events[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    if (user && (user.role === "SUPER_ADMIN" || user.role === "EVENT_ADMIN")) {
      fetchEvents();
    }
  }, [user]);

  const handleScanTicket = async () => {
    if (!ticketCode.trim() || !selectedEvent) return;

    setLoading(true);
    setScanResult(null);

    try {
      const response = await fetch("/api/admin/verify-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketCode: ticketCode.trim(),
          eventId: selectedEvent,
          adminUserId: user.uid,
        }),
      });

      const data = await response.json();
      setScanResult(data);

      if (data.success) {
        setTicketCode("");
      }
    } catch (error) {
      console.error("Error verifying ticket:", error);
      setScanResult({
        success: false,
        message: "Failed to verify ticket. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (user.role !== "SUPER_ADMIN" && user.role !== "EVENT_ADMIN") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">
            You don't have permission to access the ticket scanner.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout activeTab="scanner">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Ticket Scanner</h1>
          <p className="text-gray-300">Scan QR codes to verify event tickets</p>
        </div>

        {/* Event Selection */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <label className="block text-white font-medium mb-3">
            Select Event
          </label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose an event...</option>
            {events.map((event) => (
              <option key={event.id} value={event.id} className="bg-slate-900">
                {event.title} - {new Date(event.date).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>

        {/* Ticket Input */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <label className="block text-white font-medium mb-3">
            Ticket Code
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={ticketCode}
              onChange={(e) => setTicketCode(e.target.value)}
              placeholder="Scan QR code or enter ticket code manually"
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === "Enter" && handleScanTicket()}
            />
            <button
              onClick={handleScanTicket}
              disabled={loading || !ticketCode.trim() || !selectedEvent}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
          </div>
        </div>

        {/* Scan Result */}
        {scanResult && (
          <div
            className={`backdrop-blur-md rounded-xl border p-6 ${
              scanResult.success
                ? "bg-green-500/20 border-green-500/30"
                : "bg-red-500/20 border-red-500/30"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  scanResult.success ? "bg-green-500/20" : "bg-red-500/20"
                }`}
              >
                <span className="text-2xl">
                  {scanResult.success ? "✅" : "❌"}
                </span>
              </div>
              <div className="flex-1">
                <h3
                  className={`text-lg font-bold mb-2 ${
                    scanResult.success ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {scanResult.success ? "Valid Ticket" : "Invalid Ticket"}
                </h3>
                <p className="text-white mb-3">{scanResult.message}</p>

                {scanResult.success && scanResult.booking && (
                  <div className="bg-white/10 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Attendee:</span>
                      <span className="text-white font-medium">
                        {scanResult.booking.user?.name || "Guest"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Event:</span>
                      <span className="text-white font-medium">
                        {scanResult.booking.event?.title}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Tickets:</span>
                      <span className="text-white font-medium">
                        {scanResult.booking.tickets}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Booking Date:</span>
                      <span className="text-white font-medium">
                        {new Date(
                          scanResult.booking.createdAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <h3 className="text-white font-medium mb-3">📱 How to use:</h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>1. Select the event you're managing</li>
            <li>2. Use your phone camera to scan the QR code on the ticket</li>
            <li>3. Or manually enter the ticket code</li>
            <li>4. Press "Verify" to check the ticket validity</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
