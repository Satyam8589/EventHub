"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./PaymentLookup.module.css";

export default function PaymentLookup() {
  const { user } = useAuth();
  const [searchMode, setSearchMode] = useState("paymentId"); // 'paymentId' or 'email'
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchValue.trim()) {
      setError(`Please enter a ${searchMode === "paymentId" ? "payment ID" : "email address"}`);
      return;
    }

    if (!user?.uid) {
      setError("You must be logged in to use this feature");
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const queryParam = searchMode === "paymentId" 
        ? `paymentId=${encodeURIComponent(searchValue)}`
        : `email=${encodeURIComponent(searchValue)}`;
      
      const response = await fetch(
        `/api/admin/payment-lookup?${queryParam}&userId=${user.uid}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch payment details");
      }

      setData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>🔍 Payment Lookup</h2>
        <p>Search for complete user and payment details</p>
      </div>

      <form onSubmit={handleSearch} className={styles.searchForm}>
        {/* Search Mode Toggle */}
        <div className={styles.toggleContainer}>
          <button
            type="button"
            className={`${styles.toggleButton} ${searchMode === "paymentId" ? styles.active : ""}`}
            onClick={() => {
              setSearchMode("paymentId");
              setSearchValue("");
              setError(null);
              setData(null);
            }}
          >
            💳 Payment ID
          </button>
          <button
            type="button"
            className={`${styles.toggleButton} ${searchMode === "email" ? styles.active : ""}`}
            onClick={() => {
              setSearchMode("email");
              setSearchValue("");
              setError(null);
              setData(null);
            }}
          >
            📧 Email
          </button>
        </div>

        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder={
              searchMode === "paymentId"
                ? "Enter Payment ID (e.g., pay_R1PRyMm1JAo2VA)"
                : "Enter Email Address (e.g., user@example.com)"
            }
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className={styles.searchInput}
          />
          <button
            type="submit"
            disabled={loading}
            className={styles.searchButton}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {error && (
        <div className={styles.error}>
          <span>❌</span> {error}
        </div>
      )}

      {data && (
        <div className={styles.results}>
          {/* User Information */}
          <section className={styles.section}>
            <h3>👤 User Information</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label>Name</label>
                <span>{data.booking.user.name}</span>
              </div>
              <div className={styles.field}>
                <label>Email</label>
                <span>{data.booking.user.email}</span>
              </div>
              <div className={styles.field}>
                <label>Phone</label>
                <span>{data.booking.user.phone || "N/A"}</span>
              </div>
              <div className={styles.field}>
                <label>Role</label>
                <span className={styles.badge}>{data.booking.user.role}</span>
              </div>
              <div className={styles.field}>
                <label>User Since</label>
                <span>{formatDate(data.booking.user.createdAt)}</span>
              </div>
            </div>
          </section>

          {/* User Statistics */}
          <section className={styles.section}>
            <h3>📊 User Statistics</h3>
            <div className={styles.statsGrid}>
              <div className={styles.stat}>
                <div className={styles.statValue}>{data.stats.totalBookings}</div>
                <div className={styles.statLabel}>Total Bookings</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>
                  {data.stats.confirmedBookings}
                </div>
                <div className={styles.statLabel}>Confirmed</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>
                  {formatCurrency(data.stats.totalSpent)}
                </div>
                <div className={styles.statLabel}>Total Spent</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>
                  {data.stats.ticketScansCount}
                </div>
                <div className={styles.statLabel}>Ticket Scans</div>
              </div>
            </div>
          </section>

          {/* Booking Details */}
          <section className={styles.section}>
            <h3>🎫 Booking Details</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label>Booking ID</label>
                <span className={styles.mono}>{data.booking.id}</span>
              </div>
              <div className={styles.field}>
                <label>Status</label>
                <span
                  className={`${styles.badge} ${
                    styles[data.booking.status.toLowerCase()]
                  }`}
                >
                  {data.booking.status}
                </span>
              </div>
              <div className={styles.field}>
                <label>Payment ID</label>
                <span className={styles.mono}>{data.booking.paymentId}</span>
              </div>
              <div className={styles.field}>
                <label>Amount</label>
                <span>{formatCurrency(data.booking.totalAmount)}</span>
              </div>
              <div className={styles.field}>
                <label>Tickets</label>
                <span>{data.booking.tickets}</span>
              </div>
              <div className={styles.field}>
                <label>Created At</label>
                <span>{formatDate(data.booking.createdAt)}</span>
              </div>
            </div>
          </section>

          {/* Event Details */}
          <section className={styles.section}>
            <h3>🎉 Event Details</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label>Event Title</label>
                <span>{data.booking.event.title}</span>
              </div>
              <div className={styles.field}>
                <label>Date</label>
                <span>{formatDate(data.booking.event.date)}</span>
              </div>
              <div className={styles.field}>
                <label>Time</label>
                <span>{data.booking.event.time}</span>
              </div>
              <div className={styles.field}>
                <label>Location</label>
                <span>{data.booking.event.location}</span>
              </div>
              <div className={styles.field}>
                <label>Category</label>
                <span className={styles.badge}>
                  {data.booking.event.category}
                </span>
              </div>
            </div>
          </section>

          {/* Webhook Tracking */}
          <section className={styles.section}>
            <h3>🔔 Webhook Tracking</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label>Verification Attempts</label>
                <span>{data.booking.verification_attempts || 0}</span>
              </div>
              <div className={styles.field}>
                <label>Last Verification</label>
                <span>
                  {formatDate(data.booking.last_verification_attempt)}
                </span>
              </div>
              <div className={styles.field}>
                <label>Webhook Received</label>
                <span>{formatDate(data.booking.webhook_received_at)}</span>
              </div>
              <div className={styles.field}>
                <label>Webhook Processed</label>
                <span>{formatDate(data.booking.webhook_processed_at)}</span>
              </div>
            </div>
          </section>

          {/* Verification Logs */}
          {data.verificationLogs.length > 0 && (
            <section className={styles.section}>
              <h3>📝 Verification Logs ({data.verificationLogs.length})</h3>
              <div className={styles.table}>
                <table>
                  <thead>
                    <tr>
                      <th>Attempt</th>
                      <th>Source</th>
                      <th>Success</th>
                      <th>Response Time</th>
                      <th>Message</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.verificationLogs.map((log, index) => (
                      <tr key={index}>
                        <td>{log.attempt_number}</td>
                        <td>
                          <span className={styles.badge}>
                            {log.verification_source}
                          </span>
                        </td>
                        <td>
                          {log.success ? (
                            <span className={styles.success}>✅ Yes</span>
                          ) : (
                            <span className={styles.failed}>❌ No</span>
                          )}
                        </td>
                        <td>{log.response_time_ms}ms</td>
                        <td>{log.error_message || "—"}</td>
                        <td>{formatDate(log.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Webhook Events */}
          {data.webhookEvents.length > 0 && (
            <section className={styles.section}>
              <h3>🌐 Webhook Events ({data.webhookEvents.length})</h3>
              <div className={styles.table}>
                <table>
                  <thead>
                    <tr>
                      <th>Event Type</th>
                      <th>Signature Valid</th>
                      <th>Processed</th>
                      <th>Error</th>
                      <th>Received At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.webhookEvents.map((event, index) => (
                      <tr key={index}>
                        <td>
                          <span className={styles.badge}>
                            {event.event_type}
                          </span>
                        </td>
                        <td>
                          {event.signature_valid ? (
                            <span className={styles.success}>✅ Valid</span>
                          ) : (
                            <span className={styles.failed}>❌ Invalid</span>
                          )}
                        </td>
                        <td>
                          {event.processed ? (
                            <span className={styles.success}>✅ Yes</span>
                          ) : (
                            <span className={styles.pending}>⏳ Pending</span>
                          )}
                        </td>
                        <td>{event.processing_error || "—"}</td>
                        <td>{formatDate(event.received_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Ticket Scans */}
          {data.ticketScans.length > 0 && (
            <section className={styles.section}>
              <h3>🎟️ Ticket Scans ({data.ticketScans.length})</h3>
              <div className={styles.table}>
                <table>
                  <thead>
                    <tr>
                      <th>Scan Date</th>
                      <th>Scanned At</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ticketScans.map((scan, index) => (
                      <tr key={index}>
                        <td>{formatDate(scan.scannedAt)}</td>
                        <td>{formatDate(scan.scannedAt)}</td>
                        <td>
                          <span className={styles.success}>✅ Scanned</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Recent Bookings */}
          {data.userBookings.length > 0 && (
            <section className={styles.section}>
              <h3>📋 Recent Bookings ({data.userBookings.length})</h3>
              <div className={styles.table}>
                <table>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Status</th>
                      <th>Amount</th>
                      <th>Payment ID</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.userBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>{booking.event?.title || "N/A"}</td>
                        <td>
                          <span
                            className={`${styles.badge} ${
                              styles[booking.status.toLowerCase()]
                            }`}
                          >
                            {booking.status}
                          </span>
                        </td>
                        <td>{formatCurrency(booking.totalAmount)}</td>
                        <td className={styles.mono}>{booking.paymentId}</td>
                        <td>{formatDate(booking.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
