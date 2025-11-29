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
      // Use dbUser.id for EVENT_ADMIN, fallback to user.id or user.uid
      const adminUserId = user.dbUser?.id || user.id || user.uid;
      const response = await fetch(
        `/api/admin/events?adminUserId=${adminUserId}`
      );
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
      const scannerId = user?.dbUser?.id || user?.id || user?.uid;
      const response = await fetch(
        `/api/admin/scan-ticket?eventId=${eventId}&scannerId=${scannerId}`
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
          scannedBy: user?.dbUser?.id || user?.id || user?.uid,
          eventId: selectedEvent,
        }),
      });

      const data = await response.json();

      // Special handling for different response types
      const isAllTicketsUsed = data.booking?.isFullyCompleted === true;
      const isAlreadyScanned = data.isAlreadyScanned === true;

      setScanResult({
        success: response.ok || isAllTicketsUsed, // Treat fully completed as success, but not already scanned
        isAlreadyScanned: isAlreadyScanned, // Flag for red popup styling
        ...data,
      });

      if (response.ok && !isAlreadyScanned) {
        // Show success popup only for new successful scans
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
      } else if (isAllTicketsUsed && !isAlreadyScanned) {
        // Handle fully completed bookings (all days attended)
        setSuccessData(data.booking);
        setShowSuccessPopup(true);

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
                    {(() => {
                      const dateStr = event.date;
                      let eventDate;
                      if (dateStr.includes("T") && dateStr.includes("Z")) {
                        eventDate = new Date(dateStr);
                      } else if (dateStr.includes("T")) {
                        eventDate = new Date(dateStr + "Z");
                      } else {
                        eventDate = new Date(dateStr.replace(" ", "T") + "Z");
                      }

                      if (!eventDate || isNaN(eventDate.getTime())) {
                        return "Date TBD";
                      }

                      return eventDate.toLocaleDateString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      });
                    })()}{" "}
                    at {event.time}
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
                          {(() => {
                            const event = events.find(
                              (e) => e.id === selectedEvent
                            );
                            if (!event) return "Date TBD";

                            const dateStr = event.date;
                            let eventDate;
                            if (
                              dateStr.includes("T") &&
                              dateStr.includes("Z")
                            ) {
                              eventDate = new Date(dateStr);
                            } else if (dateStr.includes("T")) {
                              eventDate = new Date(dateStr + "Z");
                            } else {
                              eventDate = new Date(
                                dateStr.replace(" ", "T") + "Z"
                              );
                            }

                            if (!eventDate || isNaN(eventDate.getTime())) {
                              return "Date TBD";
                            }

                            return eventDate.toLocaleDateString("en-IN", {
                              timeZone: "Asia/Kolkata",
                            });
                          })()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Time:</span>
                        <span className="text-white ml-2">
                          {(() => {
                            const event = events.find(
                              (e) => e.id === selectedEvent
                            );
                            if (!event || !event.time) return "Time TBD";
                            const time = event.time;
                            // If time already has AM/PM, return it
                            if (time.includes("AM") || time.includes("PM")) {
                              return time;
                            }
                            // Convert 24-hour to 12-hour format
                            const timeParts = time.split(":");
                            if (timeParts.length >= 2) {
                              let hours = parseInt(timeParts[0]);
                              const minutes = timeParts[1];
                              const ampm = hours >= 12 ? "PM" : "AM";
                              hours = hours % 12;
                              hours = hours ? hours : 12;
                              return `${hours}:${minutes} ${ampm}`;
                            }
                            return time;
                          })()}
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
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
                        {statistics.statistics.scannedTickets || 0}
                      </div>
                      <div className="text-sm text-green-200">
                        Scanned Tickets
                      </div>
                    </div>
                    <div className="text-center p-3 bg-purple-500/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-300">
                        {statistics.statistics.scanProgress || 0}%
                      </div>
                      <div className="text-sm text-purple-200">
                        Scan Progress
                      </div>
                    </div>
                    {statistics.statistics.completedBookings !== undefined && (
                      <div className="text-center p-3 bg-emerald-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-300">
                          {statistics.statistics.completedBookings}
                        </div>
                        <div className="text-sm text-emerald-200">
                          Fully Completed
                        </div>
                      </div>
                    )}
                    {statistics.statistics.completionRate !== undefined && (
                      <div className="text-center p-3 bg-teal-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-teal-300">
                          {statistics.statistics.completionRate}%
                        </div>
                        <div className="text-sm text-teal-200">
                          Completion Rate
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Bookings Overview */}
            {statistics &&
              statistics.userBookings &&
              statistics.userBookings.length > 0 && (
                <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-2 sm:p-4">
                  <h2 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3 px-1">
                    👥 User Bookings ({statistics.userBookings.length})
                  </h2>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {statistics.userBookings.map((userBooking, index) => (
                      <div
                        key={userBooking.id}
                        className={`p-2 sm:p-3 rounded-lg border ${
                          userBooking.isCompleted
                            ? "bg-green-500/10 border-green-500/20"
                            : userBooking.scannedTickets > 0
                            ? "bg-yellow-500/10 border-yellow-500/20"
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="font-medium text-white text-sm sm:text-base truncate">
                                {userBooking.userName}
                              </div>
                              {userBooking.isCompleted && (
                                <span className="px-1.5 py-0.5 text-xs bg-green-500/20 text-green-300 rounded-full whitespace-nowrap">
                                  ✅ Done
                                </span>
                              )}
                              {!userBooking.isCompleted &&
                                userBooking.scannedTickets > 0 && (
                                  <span className="px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-300 rounded-full whitespace-nowrap">
                                    🟡 Progress
                                  </span>
                                )}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-400 mt-0.5 truncate">
                              {userBooking.userEmail}
                            </div>
                            {userBooking.userPhone !== "Not provided" && (
                              <div className="text-xs sm:text-sm text-gray-400 truncate">
                                📞 {userBooking.userPhone}
                              </div>
                            )}
                          </div>
                          <div className="text-left sm:text-right shrink-0">
                            <div className="text-base sm:text-lg font-bold text-white">
                              {userBooking.scannedTickets}/
                              {userBooking.totalQRs ||
                                userBooking.totalTickets ||
                                1}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-300">
                              QR scanned
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {userBooking.progressPercentage}% complete
                            </div>
                            {userBooking.scannedDays.length > 0 && (
                              <div className="text-xs text-blue-300 mt-0.5">
                                Days: {userBooking.scannedDays.join(", ")}
                              </div>
                            )}
                          </div>
                        </div>

                        {userBooking.remainingTickets > 0 && (
                          <div className="mt-1 text-xs text-gray-400">
                            {userBooking.remainingTickets} ticket(s) remaining
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
              scanResult.isAlreadyScanned
                ? "bg-red-500/10 border-red-500/20" // Red styling for already scanned
                : scanResult.success
                ? "bg-green-500/10 border-green-500/20"
                : "bg-red-500/10 border-red-500/20"
            }`}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div
                className={`text-2xl ${
                  scanResult.isAlreadyScanned
                    ? "text-red-300" // Red text for already scanned
                    : scanResult.success
                    ? "text-green-300"
                    : "text-red-300"
                }`}
              >
                {scanResult.isAlreadyScanned
                  ? "⚠️" // Warning icon for already scanned
                  : scanResult.success
                  ? "✅"
                  : "❌"}
              </div>
              <h3
                className={`text-lg font-semibold ${
                  scanResult.isAlreadyScanned
                    ? "text-red-300" // Red text for already scanned
                    : scanResult.success
                    ? "text-green-300"
                    : "text-red-300"
                }`}
              >
                {scanResult.isAlreadyScanned
                  ? "Already Verified"
                  : scanResult.booking?.isFullyCompleted
                  ? "🎉 Booking Completed"
                  : scanResult.success
                  ? "Valid Ticket"
                  : "Invalid Ticket"}
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

                {/* Special display for already scanned tickets */}
                {scanResult.isAlreadyScanned && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="text-sm text-red-200 space-y-1">
                      <div className="text-red-300 font-medium text-center mb-2">
                        ⚠️ Already Verified
                      </div>
                      {scanResult.booking.eventDay && (
                        <div>
                          <span className="font-medium">Event Day:</span>{" "}
                          {scanResult.booking.eventDay}
                        </div>
                      )}
                      {scanResult.booking.verifiedAt && (
                        <div>
                          <span className="font-medium">
                            Previously verified at:
                          </span>{" "}
                          {scanResult.booking.verifiedAt}
                        </div>
                      )}
                      <div className="text-center text-red-200 text-xs mt-2">
                        This ticket has already been used for today's event.
                      </div>
                    </div>
                  </div>
                )}

                {scanResult.booking.tickets && !scanResult.isAlreadyScanned && (
                  <div className="text-gray-300">
                    <span className="font-medium">Total Tickets:</span>{" "}
                    {scanResult.booking.totalTickets ||
                      scanResult.booking.tickets}
                  </div>
                )}

                {/* Special display for completed bookings */}
                {scanResult.booking.isFullyCompleted && (
                  <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="text-sm text-green-200 space-y-1">
                      <div className="text-green-300 font-medium text-center mb-2">
                        🎉 Booking Fully Completed!
                      </div>
                      <div>
                        <span className="font-medium">Scanned Tickets:</span>{" "}
                        {scanResult.booking.scannedDays ||
                          scanResult.booking.scannedTickets}{" "}
                        /{" "}
                        {scanResult.booking.totalEventDays ||
                          scanResult.booking.totalTickets}
                      </div>
                      <div>
                        <span className="font-medium">Days Attended:</span>{" "}
                        {scanResult.booking.daysAttended || "N/A"}
                      </div>
                      <div className="text-center text-green-200 text-xs mt-2">
                        {scanResult.booking.completionMessage}
                      </div>
                    </div>
                  </div>
                )}

                {scanResult.booking.ticketNumber && (
                  <div className="text-gray-300">
                    <span className="font-medium">Ticket Used Today:</span>{" "}
                    <span className="text-green-400 font-semibold">
                      #{scanResult.booking.ticketNumber}
                    </span>
                  </div>
                )}
                {scanResult.booking.progressInfo &&
                  !scanResult.isAlreadyScanned && (
                    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="text-sm text-blue-200 space-y-1">
                        <div>
                          <span className="font-medium">Event Day:</span>{" "}
                          {scanResult.booking.progressInfo.currentDay}
                        </div>
                        <div>
                          <span className="font-medium">Total Tickets:</span>{" "}
                          {scanResult.booking.totalTickets ||
                            scanResult.booking.tickets}
                        </div>
                        {scanResult.booking.progressInfo.remainingTickets ===
                          0 && (
                          <div className="text-green-300 font-medium">
                            🎉 All tickets have been used!
                          </div>
                        )}
                        {scanResult.booking.isFullyCompleted && (
                          <div className="mt-2 p-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                            <div className="text-green-300 font-medium text-sm">
                              ✨ This booking is now fully completed and marked
                              as COMPLETED in the system.
                            </div>
                          </div>
                        )}
                      </div>
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
