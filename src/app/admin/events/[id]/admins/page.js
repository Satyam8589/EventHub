"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";

export default function EventAdminsPage() {
  const [event, setEvent] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();

  // Check access and fetch data
  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== "SUPER_ADMIN") {
      router.push("/admin");
      return;
    }

    fetchEventData();
  }, [user, authLoading, router, params.id]);

  const fetchEventData = async () => {
    try {
      setLoading(true);

      // Fetch event details
      const eventResponse = await fetch(`/api/admin/events/${params.id}`);
      if (!eventResponse.ok) throw new Error("Failed to fetch event");
      const eventData = await eventResponse.json();
      setEvent(eventData.event);

      // Fetch event admins
      const adminsResponse = await fetch(
        `/api/admin/events/${params.id}/admins`
      );
      if (!adminsResponse.ok) throw new Error("Failed to fetch admins");
      const adminsData = await adminsResponse.json();
      setAdmins(adminsData.admins);
    } catch (error) {
      console.error("Error fetching event data:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await fetch(
        `/api/admin/users/search?q=${encodeURIComponent(query.trim())}`
      );
      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      setSearchResults(data.users);
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const assignAdmin = async (userId) => {
    try {
      setAssigning(true);
      const response = await fetch(`/api/admin/events/${params.id}/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          assignedBy: user.uid,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to assign admin");
      }

      await fetchEventData();
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error assigning admin:", error);
      alert(error.message);
    } finally {
      setAssigning(false);
    }
  };

  const removeAdmin = async (adminId) => {
    if (!confirm("Are you sure you want to remove this admin?")) return;

    try {
      const response = await fetch(
        `/api/admin/events/${params.id}/admins/${adminId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove admin");
      }

      await fetchEventData();
    } catch (error) {
      console.error("Error removing admin:", error);
      alert(error.message);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (authLoading || loading) {
    return (
      <AdminLayout activeTab="events">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeTab="events">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Event Admins</h1>
            <p className="text-gray-300 mt-1">
              Manage admins for: {event?.title}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">
              {admins.length}/2 admins assigned
            </div>
          </div>
        </div>

        {/* Current Admins */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Current Admins
          </h2>

          {admins.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No admins assigned to this event yet.
            </div>
          ) : (
            <div className="space-y-4">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {admin.name?.charAt(0)?.toUpperCase() || "A"}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{admin.name}</h3>
                      <p className="text-sm text-gray-400">{admin.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Assigned on{" "}
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeAdmin(admin.id)}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Admin */}
        {admins.length < 2 && (
          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Assign New Admin
            </h2>

            <div className="space-y-4">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Search Users
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Search Results */}
              {searching && (
                <div className="text-center py-4 text-gray-400">
                  Searching...
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {user.name?.charAt(0)?.toUpperCase() || "U"}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-white">
                            {user.name}
                          </h4>
                          <p className="text-sm text-gray-400">{user.email}</p>
                          <p className="text-xs text-gray-500">
                            Role: {user.role}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => assignAdmin(user.id)}
                        disabled={assigning}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {assigning ? "Assigning..." : "Assign"}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 &&
                !searching &&
                searchResults.length === 0 && (
                  <div className="text-center py-4 text-gray-400">
                    No eligible users found. Users must not be admins of other
                    events.
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h3 className="text-blue-300 font-medium mb-2">
            Admin Assignment Rules
          </h3>
          <ul className="text-sm text-blue-200 space-y-1">
            <li>• Each event can have maximum 2 admins</li>
            <li>• Users can only be admin of one event at a time</li>
            <li>
              • Admins can scan QR codes to verify tickets for their assigned
              event
            </li>
            <li>• Super admins can assign/remove event admins</li>
            <li>
              • When removed, users' roles revert to ATTENDEE if they have no
              other admin assignments
            </li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
