"use client";

import { useState, useEffect } from "react";

export default function ContactMessagesAdmin() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");

  const fetchMessages = async () => {
    if (!userId) {
      setError("Please enter your user ID");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/contact-messages?userId=${userId}`
      );
      const data = await response.json();

      if (response.ok) {
        setMessages(data.messages || []);
        setError("");
      } else {
        setError(data.error || "Failed to fetch messages");
        setMessages([]);
      }
    } catch (err) {
      setError("Failed to fetch messages");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Contact Messages Admin
          </h1>
          <p className="mt-2 text-gray-600">
            View and manage contact form submissions
          </p>
        </div>

        {/* User ID Input */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Authentication
          </h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label
                htmlFor="userId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                User ID (Admin Only)
              </label>
              <input
                type="text"
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter your user ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={fetchMessages}
              disabled={loading || !userId}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Fetch Messages"}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Messages List */}
        {messages.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Contact Messages ({messages.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {messages.map((message, index) => (
                <div key={message.id || index} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {message.name}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          New
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">Email:</span>
                            <a
                              href={`mailto:${message.email}`}
                              className="text-blue-600 hover:text-blue-500"
                            >
                              {message.email}
                            </a>
                          </div>
                          {message.phone && (
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Phone:</span>
                              <a
                                href={`tel:${message.phone}`}
                                className="text-blue-600 hover:text-blue-500"
                              >
                                {message.phone}
                              </a>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Received:</span>
                          <span>{formatDate(message.created_at)}</span>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-md p-4">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Message:
                        </h4>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {message.message}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Messages State */}
        {messages.length === 0 && !loading && !error && userId && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No contact messages found</p>
            <p className="text-gray-400 text-sm mt-2">
              Messages will appear here when users submit the contact form
            </p>
          </div>
        )}

        {/* Instructions */}
        {!userId && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-6">
            <h3 className="font-medium text-blue-900 mb-2">Instructions:</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Enter your admin user ID to view contact messages</li>
              <li>
                • Only SUPER_ADMIN and EVENT_ADMIN users can access this page
              </li>
              <li>
                • Messages are automatically stored when users submit the
                contact form
              </li>
              <li>• This page shows the most recent 50 messages</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
