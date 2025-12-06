"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./PaymentLookup.module.css";

export default function UserLookup() {
  const { user } = useAuth();
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchValue.trim()) {
      setError("Please enter a username");
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
      const response = await fetch(
        `/api/admin/user-lookup?username=${encodeURIComponent(searchValue)}&userId=${user.uid}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch user details");
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>👤 User Lookup</h2>
        <p>Search for user details by username</p>
      </div>

      <form onSubmit={handleSearch} className={styles.searchForm}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Enter username (e.g., john_doe)"
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
                <span>{data.user.name}</span>
              </div>
              <div className={styles.field}>
                <label>Username</label>
                <span>@{data.user.username}</span>
              </div>
              <div className={styles.field}>
                <label>Email</label>
                <span>{data.user.email}</span>
              </div>
              <div className={styles.field}>
                <label>Phone</label>
                <span>{data.user.phone || "N/A"}</span>
              </div>
              <div className={styles.field}>
                <label>Role</label>
                <span className={styles.badge}>{data.user.role}</span>
              </div>
              <div className={styles.field}>
                <label>User Since</label>
                <span>{formatDate(data.user.created_at)}</span>
              </div>
            </div>
          </section>

          {/* User Statistics */}
          <section className={styles.section}>
            <h3>📊 User Statistics</h3>
            <div className={styles.statsGrid}>
              <div className={styles.stat}>
                <div className={styles.statValue}>{data.stats.totalReels}</div>
                <div className={styles.statLabel}>Total Reels</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>
                  {data.stats.totalLikes}
                </div>
                <div className={styles.statLabel}>Total Likes</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>
                  {data.stats.totalComments}
                </div>
                <div className={styles.statLabel}>Total Comments</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>
                  {data.stats.totalBookings}
                </div>
                <div className={styles.statLabel}>Event Bookings</div>
              </div>
            </div>
          </section>

          {/* User Reels */}
          {data.reels.length > 0 && (
            <section className={styles.section}>
              <h3>🎬 User Reels ({data.reels.length})</h3>
              <div className={styles.table}>
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Likes</th>
                      <th>Comments</th>
                      <th>Tags</th>
                      <th>Posted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.reels.map((reel) => (
                      <tr key={reel.id}>
                        <td>
                          <div style={{ maxWidth: "200px" }}>
                            <strong>{reel.title}</strong>
                            {reel.description && (
                              <div
                                style={{
                                  fontSize: "0.85em",
                                  color: "#888",
                                  marginTop: "4px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {reel.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={styles.badge}>
                            {reel.media_type === "video" ? "📹 Video" : "🖼️ Image"}
                          </span>
                        </td>
                        <td>❤️ {reel.likes_count || 0}</td>
                        <td>💬 {reel.comments_count || 0}</td>
                        <td>
                          <div style={{ fontSize: "0.85em" }}>
                            {reel.tags?.slice(0, 3).map((tag, i) => (
                              <span
                                key={i}
                                style={{
                                  marginRight: "4px",
                                  color: "#6366f1",
                                }}
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>{formatDate(reel.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Recent Bookings */}
          {data.bookings.length > 0 && (
            <section className={styles.section}>
              <h3>🎫 Recent Event Bookings ({data.bookings.length})</h3>
              <div className={styles.table}>
                <table>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Status</th>
                      <th>Tickets</th>
                      <th>Amount</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bookings.map((booking) => (
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
                        <td>{booking.tickets}</td>
                        <td>
                          ₹{booking.total_amount?.toLocaleString("en-IN") || 0}
                        </td>
                        <td>{formatDate(booking.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* No Data Messages */}
          {data.reels.length === 0 && (
            <section className={styles.section}>
              <div style={{ textAlign: "center", padding: "2rem", color: "#888" }}>
                <span style={{ fontSize: "3rem" }}>📸</span>
                <p>This user hasn't posted any reels yet.</p>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
