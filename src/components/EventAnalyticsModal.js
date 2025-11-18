"use client";

import { useState, useEffect } from "react";
import {
  X,
  Users,
  DollarSign,
  Calendar,
  MapPin,
  Ticket,
  TrendingUp,
  Clock,
} from "lucide-react";

export default function EventAnalyticsModal({ eventId, isOpen, onClose }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookingStatusFilter, setBookingStatusFilter] = useState("ALL");

  useEffect(() => {
    if (isOpen && eventId) {
      fetchAnalytics();
    }
  }, [isOpen, eventId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/event-analytics?eventId=${eventId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return "Invalid date";
      return d.toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "text-green-400 bg-green-400/10";
      case "PENDING":
        return "text-yellow-400 bg-yellow-400/10";
      case "FAILED":
        return "text-red-400 bg-red-400/10";
      default:
        return "text-gray-400 bg-gray-400/10";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-blue-400" />
              Event Analytics
            </h2>
            {analytics && (
              <p className="text-white/60 mt-1">{analytics.event.name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white/60" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <span className="ml-3 text-white/60">Loading analytics...</span>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="text-red-400 mb-2">
                ⚠️ Error loading analytics
              </div>
              <p className="text-white/60">{error}</p>
              <button
                onClick={fetchAnalytics}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : analytics ? (
            <div className="p-6 space-y-6">
              {/* Event Info */}
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Event Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-white/60 text-sm">Start Date</p>
                      <p className="text-white font-medium">
                        {formatDate(analytics.event.startDate)}
                      </p>
                    </div>
                  </div>
                  {analytics.event.endDate && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-white/60 text-sm">End Date</p>
                        <p className="text-white font-medium">
                          {formatDate(analytics.event.endDate)}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-white/60 text-sm">Location</p>
                      <p className="text-white font-medium">
                        {analytics.event.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Ticket className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-white/60 text-sm">Capacity</p>
                      <p className="text-white font-medium">
                        {analytics.event.capacity || "Unlimited"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600/20 rounded-lg">
                      <Users className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Total Bookings</p>
                      <p className="text-2xl font-bold text-white">
                        {analytics.summary.totalBookings}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-600/20 rounded-lg">
                      <DollarSign className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Total Revenue</p>
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(analytics.summary.totalRevenue || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600/20 rounded-lg">
                      <Ticket className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Tickets Sold</p>
                      <p className="text-2xl font-bold text-white">
                        {analytics.summary.totalTickets || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border border-yellow-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-600/20 rounded-lg">
                      <Users className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Unique Attendees</p>
                      <p className="text-2xl font-bold text-white">
                        {analytics.summary.uniqueAttendees}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Status */}
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Booking Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {analytics.summary.confirmedBookings}
                    </div>
                    <div className="text-white/60">Confirmed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {analytics.summary.pendingBookings}
                    </div>
                    <div className="text-white/60">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">
                      {analytics.summary.failedBookings}
                    </div>
                    <div className="text-white/60">Failed</div>
                  </div>
                </div>
                {analytics.event.capacity && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/60">Capacity Used</span>
                      <span className="text-white font-medium">
                        {analytics.summary.capacityUsed}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-green-400 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            analytics.summary.capacityUsed,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bookings */}
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Bookings</h3>
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => setBookingStatusFilter("ALL")}
                    className={`px-3 py-1 rounded-lg text-sm border ${bookingStatusFilter === "ALL" ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-white/10 text-white/70"}`}
                  >
                    All ({analytics.summary.totalBookings})
                  </button>
                  <button
                    onClick={() => setBookingStatusFilter("CONFIRMED")}
                    className={`px-3 py-1 rounded-lg text-sm border ${bookingStatusFilter === "CONFIRMED" ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-white/10 text-white/70"}`}
                  >
                    Confirmed ({analytics.summary.confirmedBookings})
                  </button>
                  <button
                    onClick={() => setBookingStatusFilter("PENDING")}
                    className={`px-3 py-1 rounded-lg text-sm border ${bookingStatusFilter === "PENDING" ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-white/10 text-white/70"}`}
                  >
                    Pending ({analytics.summary.pendingBookings})
                  </button>
                  <button
                    onClick={() => setBookingStatusFilter("FAILED")}
                    className={`px-3 py-1 rounded-lg text-sm border ${bookingStatusFilter === "FAILED" ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-white/10 text-white/70"}`}
                  >
                    Failed ({analytics.summary.failedBookings})
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-white/60 pb-2">Customer</th>
                        <th className="text-left text-white/60 pb-2">Contact</th>
                        <th className="text-left text-white/60 pb-2">Amount</th>
                        <th className="text-left text-white/60 pb-2">Tickets</th>
                        <th className="text-left text-white/60 pb-2">Status</th>
                        <th className="text-left text-white/60 pb-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const src = analytics.allBookings && analytics.allBookings.length > 0 ? analytics.allBookings : analytics.recentBookings;
                        const filtered = bookingStatusFilter === "ALL" ? src : src.filter((b) => b.status === bookingStatusFilter);
                        return filtered.map((booking) => (
                          <tr key={booking.id} className="border-b border-white/5">
                            <td className="py-3 text-white">
                              {booking.userName || booking.user?.name || "Unknown"}
                              {(booking.paymentId || booking.razorpayOrderId) && (
                                <div className="text-white/40 text-xs mt-1">
                                  {booking.paymentId || booking.razorpayOrderId}
                                </div>
                              )}
                            </td>
                            <td className="py-3 text-white/60 text-sm">
                              <div>{booking.userEmail || booking.user?.email || "Unknown"}</div>
                              {((booking.userPhone || booking.user?.phone)) && (
                                <div className="text-white/40">
                                  {booking.userPhone || booking.user?.phone}
                                </div>
                              )}
                            </td>
                            <td className="py-3 text-white font-medium">
                              {formatCurrency(booking.amount || booking.totalAmount)}
                            </td>
                            <td className="py-3 text-white">
                              {booking.ticketCount || booking.tickets}
                            </td>
                            <td className="py-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(booking.status)}`}>
                                {booking.status}
                              </span>
                            </td>
                            <td className="py-3 text-white/60 text-sm">
                              {formatDate(booking.createdAt)}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                  {(() => {
                    const src = analytics.allBookings && analytics.allBookings.length > 0 ? analytics.allBookings : analytics.recentBookings;
                    const filtered = bookingStatusFilter === "ALL" ? src : src.filter((b) => b.status === bookingStatusFilter);
                    return filtered.length === 0 ? (
                      <div className="text-center py-8 text-white/60">No bookings found for this event</div>
                    ) : null;
                  })()}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
