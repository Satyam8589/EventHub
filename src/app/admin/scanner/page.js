"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import QRCameraScanner from "@/components/QRCameraScanner";
import VerificationSuccessPopup from "@/components/VerificationSuccessPopup";

export default function TicketScanner() {
  const [bookingId, setBookingId] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [statistics, setStatistics] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Check admin access and fetch events
  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== "EVENT_ADMIN") {
      router.push("/admin");
      return;
    }

    fetchAdminEvents();
  }, [user, authLoading, router]);

  const fetchAdminEvents = async () => {
    try {
      setLoading(true);
      // Get events where user is admin
      const response = await fetch(`/api/admin/events?adminId=${user.uid}`);
      if (!response.ok) throw new Error("Failed to fetch events");

      const data = await response.json();
      setEvents(data.events || []);

      // Auto-select first event if available
      if (data.events && data.events.length > 0) {
        const firstEvent = data.events[0];
        setSelectedEvent(firstEvent.id);
        await fetchEventStatistics(firstEvent.id);
      }
    } catch (error) {
      console.error("Error fetching admin events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventStatistics = async (eventId) => {
    try {
      const response = await fetch(
        `/api/admin/scan-ticket?eventId=${eventId}&scannerId=${user.uid}`
      );
      if (!response.ok) throw new Error("Failed to fetch statistics");

      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const handleEventSelect = async (eventId) => {
    setSelectedEvent(eventId);
    setScanResult(null);
    await fetchEventStatistics(eventId);
  };

  const handleScanTicket = async (scannedBookingId = null) => {
    const idToScan = scannedBookingId || bookingId.trim();
    if (!idToScan || !selectedEvent) return;

    setLoading(true);
    setScanResult(null);

    try {
      const response = await fetch("/api/admin/scan-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: idToScan,
          scannedBy: user.uid,
          eventId: selectedEvent,
        }),
      });

      const data = await response.json();
      setScanResult({
        success: response.ok,
        ...data,
      });

      if (response.ok) {
        // Show success popup for successful scans
        setSuccessData(data.booking);
        setShowSuccessPopup(true);

        // Clear input if manually typed
        if (!scannedBookingId) {
          setBookingId("");
        }

        // Refresh statistics
        await fetchEventStatistics(selectedEvent);

        // Hide camera after successful scan
        if (showCamera) {
          setShowCamera(false);
        }
      }
    } catch (error) {
      console.error("Error scanning ticket:", error);
      setScanResult({
        success: false,
        error: "Network error",
        message: "Failed to connect to server",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle QR camera scan
  const handleQRScan = (result) => {
    if (result && result.trim()) {
      handleScanTicket(result.trim());
    }
  };

  // Handle camera error
  const handleCameraError = (error) => {
    console.error("Camera error:", error);
    setScanResult({
      success: false,
      error: "Camera error",
      message: "Failed to access camera. Please try manual entry.",
    });
  };

  if (authLoading || loading) {
    return (
      <AdminLayout activeTab="scanner">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  if (events.length === 0) {
    return (
      <AdminLayout activeTab="scanner">
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <span className="text-4xl">📱</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            No Events Assigned
          </h2>
          <p className="text-gray-300 mb-6">
            You are not assigned as an admin to any events yet.
          </p>
          <p className="text-sm text-gray-400">
            Contact a super admin to get assigned to an event.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeTab="scanner">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">QR Code Scanner</h1>
          <p className="text-gray-300 mt-1">
            Scan tickets to verify event entry
          </p>
        </div>

        {/* Event Selection */}
        {events.length > 1 && (
          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Select Event
            </h2>
            <div className="grid gap-3">
              {events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => handleEventSelect(event.id)}
                  className={`p-4 rounded-lg text-left transition-colors ${
                    selectedEvent === event.id
                      ? "bg-blue-600 text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  <h3 className="font-medium">{event.title}</h3>
                  <p className="text-sm opacity-80">
                    {new Date(event.date).toLocaleDateString()} at {event.time}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedEvent && (
          <>
            {/* Event Info & Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event Info */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Event Details
                </h2>
                <div className="space-y-3">
                  {events.find((e) => e.id === selectedEvent) && (
                    <>
                      <div>
                        <span className="text-gray-400">Event:</span>
                        <span className="text-white ml-2 font-medium">
                          {events.find((e) => e.id === selectedEvent).title}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Date:</span>
                        <span className="text-white ml-2">
                          {new Date(
                            events.find((e) => e.id === selectedEvent).date
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Time:</span>
                        <span className="text-white ml-2">
                          {events.find((e) => e.id === selectedEvent).time}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Venue:</span>
                        <span className="text-white ml-2">
                          {events.find((e) => e.id === selectedEvent).venue}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Statistics */}
              {statistics && (
                <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">
                    Scan Statistics
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-500/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-300">
                        {statistics.statistics.totalBookings}
                      </div>
                      <div className="text-sm text-blue-200">
                        Total Bookings
                      </div>
                    </div>
                    <div className="text-center p-3 bg-green-500/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-300">
                        {statistics.statistics.verifiedBookings}
                      </div>
                      <div className="text-sm text-green-200">Verified</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-500/20 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-300">
                        {statistics.statistics.pendingVerification}
                      </div>
                      <div className="text-sm text-yellow-200">Pending</div>
                    </div>
                    <div className="text-center p-3 bg-purple-500/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-300">
                        {statistics.statistics.totalTickets}
                      </div>
                      <div className="text-sm text-purple-200">
                        Total Tickets
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Scanner Interface */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Ticket Scanner
              </h2>

              <div className="space-y-4">
                {/* Scanner Mode Toggle */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setShowCamera(false)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      !showCamera
                        ? "bg-blue-600 text-white"
                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    📝 Manual Entry
                  </button>
                  <button
                    onClick={() => setShowCamera(true)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      showCamera
                        ? "bg-blue-600 text-white"
                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    📷 Camera Scanner
                  </button>
                </div>

                {!showCamera ? (
                  /* Manual Input */
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Enter Booking ID
                    </label>
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={bookingId}
                        onChange={(e) => setBookingId(e.target.value)}
                        placeholder="Enter booking ID to verify..."
                        className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !loading) {
                            handleScanTicket();
                          }
                        }}
                      />
                      <button
                        onClick={() => handleScanTicket()}
                        disabled={loading || !bookingId.trim()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Scanning..." : "Scan"}
                      </button>
                    </div>

                    {/* Debug Test Button */}
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          const testId = "cmh2jcw280001tvn0ku8hh78n";
                          console.log("Testing with booking ID:", testId);
                          setBookingId(testId);
                          handleScanTicket(testId);
                        }}
                        className="w-full px-4 py-2 bg-purple-600/20 border border-purple-500/50 text-purple-300 rounded-lg hover:bg-purple-600/30 transition-colors text-sm"
                      >
                        🧪 Test with Known Booking ID
                      </button>
                    </div>
                  </div>
                ) : (
                  /* QR Camera Scanner */
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      QR Camera Scanner
                    </label>
                    <QRCameraScanner
                      onScan={handleQRScan}
                      onError={handleCameraError}
                      isActive={showCamera}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      Point your camera at the QR code to scan automatically
                    </p>
                  </div>
                )}

                {/* Loading indicator during scan */}
                {loading && (
                  <div className="flex items-center justify-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
                    <span className="text-blue-300">Verifying ticket...</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Scan Result */}
        {scanResult && (
          <div
            className={`rounded-xl border p-6 ${
              scanResult.success
                ? "bg-green-500/10 border-green-500/20"
                : "bg-red-500/10 border-red-500/20"
            }`}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div
                className={`text-2xl ${
                  scanResult.success ? "text-green-300" : "text-red-300"
                }`}
              >
                {scanResult.success ? "✅" : "❌"}
              </div>
              <h3
                className={`text-lg font-semibold ${
                  scanResult.success ? "text-green-300" : "text-red-300"
                }`}
              >
                {scanResult.success ? "Valid Ticket" : "Invalid Ticket"}
              </h3>
            </div>

            <p
              className={`mb-4 ${
                scanResult.success ? "text-green-200" : "text-red-200"
              }`}
            >
              {scanResult.message}
            </p>

            {scanResult.booking && (
              <div className="space-y-2 text-sm">
                <div className="text-gray-300">
                  <span className="font-medium">Attendee:</span>{" "}
                  {scanResult.booking.userName}
                </div>
                {scanResult.booking.userEmail && (
                  <div className="text-gray-300">
                    <span className="font-medium">Email:</span>{" "}
                    {scanResult.booking.userEmail}
                  </div>
                )}
                <div className="text-gray-300">
                  <span className="font-medium">Event:</span>{" "}
                  {scanResult.booking.eventTitle}
                </div>
                {scanResult.booking.tickets && (
                  <div className="text-gray-300">
                    <span className="font-medium">Tickets:</span>{" "}
                    {scanResult.booking.tickets}
                  </div>
                )}
                {scanResult.booking.status && (
                  <div className="text-gray-300">
                    <span className="font-medium">Booking Status:</span>{" "}
                    <span
                      className={`font-semibold ${
                        scanResult.booking.status === "CONFIRMED"
                          ? "text-green-400"
                          : scanResult.booking.status === "PENDING"
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {scanResult.booking.status}
                    </span>
                  </div>
                )}
                {scanResult.booking.verifiedAt && (
                  <div className="text-gray-300">
                    <span className="font-medium">Verified:</span>{" "}
                    {new Date(scanResult.booking.verifiedAt).toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {/* Show additional details if available */}
            {scanResult.details && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-200">{scanResult.details}</p>
              </div>
            )}
          </div>
        )}

        {/* Recent Verifications */}
        {selectedEvent && statistics?.recentVerifications?.length > 0 && (
          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Recent Verifications
            </h2>
            <div className="space-y-3">
              {statistics.recentVerifications.map((verification, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-white">
                      {verification.userName}
                    </div>
                    <div className="text-sm text-gray-400">
                      {verification.userEmail}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-300">
                      {verification.tickets} tickets
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(verification.verifiedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
          <h3 className="text-white font-medium mb-3">📱 How to use:</h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>1. Your assigned events are automatically loaded</li>
            <li>2. Toggle between manual entry and camera scanner</li>
            <li>3. Use camera to scan QR codes or manually enter booking ID</li>
            <li>4. Successful scans show a green confirmation popup</li>
            <li>5. View real-time statistics and recent verifications</li>
          </ul>
        </div>

        {/* Success Popup */}
        <VerificationSuccessPopup
          isVisible={showSuccessPopup}
          onClose={() => setShowSuccessPopup(false)}
          bookingData={successData}
        />
      </div>
    </AdminLayout>
  );
}
